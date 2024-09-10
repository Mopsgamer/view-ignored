/* eslint-disable unicorn/prefer-event-target */
import * as FSP from 'node:fs/promises';
import EventEmitter from 'node:events';
import pLimit from 'p-limit';
import {
	DirectoryTree,
	type ScanFolderOptions,
	type Methodology,
	File,
	type RealScanFolderOptions,
	Directory,
} from '../lib.js';

/**
 * The source of patterns.
 */
export class SourceInfo extends File {
	/**
	 * Get instance for each source file recursively.
	 */
	static async createCache(methodology: Methodology, optionsReal: RealScanFolderOptions): Promise<Map<string, SourceInfo>> {
		const map = new Map<string, SourceInfo>();

		const direntTree = await readDirectoryDeep('.', optionsReal);

		function processDirentTree(direntTree: DirectoryTree, rootSource?: SourceInfo) {
			if (rootSource === undefined) {
				const goodSource = direntTree.children.find(child => {
					if (!(child instanceof File)) {
						return false;
					}

					const isValid = methodology.findSource(optionsReal, child);
					return isValid;
				});

				if (goodSource !== undefined) {
					rootSource = new SourceInfo(goodSource.relativePath, goodSource.absolutePath, methodology, optionsReal);
				}
			}

			for (const dirent of direntTree.children) {
				if ('children' in dirent) {
					processDirentTree(dirent, rootSource);
				}

				if (rootSource !== undefined) {
					map.set(dirent.relativePath, rootSource);
				}
			}
		}

		processDirentTree(direntTree);

		return map;
	}

	constructor(
		/**
		 * The relative path to the file.
		 */
		relativePath: string,

		/**
		 * The absolute path to the file.
		 */
		absolutePath: string,

		/**
		 * The pattern parser.
		 */
		public readonly methodology: Methodology,

		/**
		 * The options.
		 */
		public readonly options?: Required<ScanFolderOptions>,
	) {
		super(relativePath, absolutePath);
	}
}

export type ReadDirectoryEventEmitter = EventEmitter<ReadDirectoryEventMap>;

export type ReadDirectoryEventMap = {
	'data': [{target: DirectoryTree | File; parent: Directory | undefined; progress: ReadDirectoryProgress}];
	'progress': [ReadDirectoryProgress];
	'end': [DirectoryTree];
};

export type ReadDirectoryStream = ReadableStream<File | DirectoryTree>;

export type ReadDirectoryProgress = {
	current: number;
	total: number;
};

type ReadDeepStreamOptions = ReadDirectoryOptions & {
	controller?: ReadDirectoryEventEmitter;
	parent?: Directory;
	progress?: ReadDirectoryProgress;
};

export async function directoryDeepCount(directoryPath: {toString(): string}, options: Pick<ReadDeepStreamOptions, 'fsa' | 'patha' | 'cwd' | 'concurrency' | 'progress'>): Promise<ReadDirectoryProgress> {
	const {fsa, patha, cwd, concurrency, progress = {current: 0, total: 0}} = options;
	const limit = pLimit(concurrency);
	const readdir = fsa.promises.readdir ?? FSP.readdir;
	const absolutePath = patha.join(cwd, String(directoryPath));
	const entryList = await readdir(absolutePath, {withFileTypes: true});

	const promises = entryList.map(entry => limit(async () => {
		++progress.total;
		if (entry.isDirectory() && !entry.isSymbolicLink()) {
			const absolutePath = patha.join(entry.parentPath, entry.name);
			const relativePath = patha.relative(cwd, absolutePath);
			await directoryDeepCount(relativePath, {...options, progress});
		}
	}));

	await Promise.all(promises);
	return progress;
}

export async function streamDirectoryDeepRecursion(directoryPath: {toString(): string}, options: ReadDeepStreamOptions): Promise<DirectoryTree> {
	const {fsa, patha, cwd, concurrency, parent, controller = new EventEmitter()} = options;
	const progress = options.progress ?? await directoryDeepCount(directoryPath, options);
	controller.emit('progress', progress);
	const limit = pLimit(concurrency);
	const readdir = fsa.promises.readdir ?? FSP.readdir;
	const absolutePath = patha.join(cwd, String(directoryPath));
	const relativePath = patha.relative(cwd, absolutePath);
	const directory = new Directory(relativePath, absolutePath);
	const entryList = await readdir(absolutePath, {withFileTypes: true});

	const promises = entryList.map(entry => limit(async () => {
		const parent = directory;
		const absolutePath = patha.join(entry.parentPath, entry.name);
		const relativePath = patha.relative(cwd, absolutePath);

		if (entry.isDirectory() && !entry.isSymbolicLink()) {
			const children = await streamDirectoryDeepRecursion(relativePath, {
				...options, controller, progress, parent,
			});
			++progress.current;
			controller.emit('progress', progress);
			return children;
		}

		const file = new File(relativePath, absolutePath);
		++progress.current;
		controller.emit('progress', progress);
		controller.emit('data', {target: file, parent: directory, progress});
		return file;
	}));

	const entryPaths = await Promise.all(promises);
	const directoryTree = new DirectoryTree(relativePath, absolutePath, entryPaths);
	controller.emit('progress', progress);
	controller.emit('data', {target: directoryTree, parent, progress});
	return directoryTree;
}

export type ReadDirectoryOptions = Pick<RealScanFolderOptions, 'cwd' | 'fsa' | 'patha' | 'concurrency'>;

export function streamDirectoryDeep(directoryPath: string, optionsReal: ReadDirectoryOptions): ReadDirectoryEventEmitter {
	const controller: ReadDirectoryEventEmitter = new EventEmitter();
	void streamDirectoryDeepRecursion(directoryPath, {...optionsReal, controller}).then(tree => controller.emit('end', tree));
	return controller;
}

/**
 * @returns Root directory.
 */
export function readDirectoryDeep(stream: ReadDirectoryEventEmitter): Promise<DirectoryTree>;
export function readDirectoryDeep(directoryPath: string, optionsReal: ReadDirectoryOptions): Promise<DirectoryTree>;
export function readDirectoryDeep(argument1: string | ReadDirectoryEventEmitter, optionsReal?: ReadDirectoryOptions): Promise<DirectoryTree> {
	return new Promise(resolve => {
		const controller = argument1 instanceof EventEmitter ? argument1 : streamDirectoryDeep(argument1, optionsReal!);
		controller.once('end', directory => {
			resolve(directory);
		});
	});
}
