/* eslint-disable unicorn/prefer-event-target */
import * as FSP from 'node:fs/promises';
import EventEmitter from 'node:events';
import pLimit from 'p-limit';
import {
	DirectoryTree,
	File,
	type RealScanFolderOptions,
	type Scanner,
} from '../lib.js';

/**
 * The source of patterns.
 */
export class SourceInfo extends File {
	static from(file: File, scanner: Scanner) {
		return new SourceInfo(file.parent, file.relativePath, file.absolutePath, scanner);
	}

	constructor(
		/**
         * The parent of the file.
         */
		parent: DirectoryTree,

		/**
		 * The relative path to the file.
		 */
		relativePath: string,

		/**
		 * The absolute path to the file.
		 */
		absolutePath: string,

		/**
		 * The scanner of patterns.
		 */
		public readonly scanner: Scanner,
	) {
		super(parent, relativePath, absolutePath);
	}
}

export type ReadDirectoryEventEmitter = EventEmitter<ReadDirectoryEventMap> & {
	run(): Promise<ReadDeepStreamDataRoot>;
};

export type ReadDeepStreamDataRoot = {
	tree: DirectoryTree;
	progress: ReadDirectoryProgress;
};
export type ReadDeepStreamData = {
	target: DirectoryTree | File;
	progress: ReadDirectoryProgress;
};

export type ReadDirectoryEventMap = {
	'data': [ReadDeepStreamData];
	'end': [ReadDeepStreamDataRoot];
	'progress': [ReadDirectoryProgress];
};

export type ReadDirectoryStream = ReadableStream<File | DirectoryTree>;

export type ReadDirectoryProgress = {
	directories: number;
	files: number;
	current: number;
	total: number;
};

export type ReadDeepStreamOptions = ReadDirectoryOptions & {
	controller?: ReadDirectoryEventEmitter;
	parent?: DirectoryTree;
	progress?: ReadDirectoryProgress;
};

export async function directoryDeepCount(directoryPath: {toString(): string}, options: Pick<ReadDeepStreamOptions, 'fsa' | 'patha' | 'cwd' | 'concurrency' | 'progress'>): Promise<ReadDirectoryProgress> {
	const {
		fsa, patha, cwd, concurrency, progress = {
			current: 0, total: 0, files: 0, directories: 0,
		},
	} = options;
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
			++progress.directories;
			return;
		}

		++progress.files;
	}));

	await Promise.all(promises);
	return progress;
}

export async function streamDirectoryDeepRecursion(directoryPath: {toString(): string}, options: ReadDeepStreamOptions): Promise<ReadDeepStreamData> {
	const {fsa, patha, cwd, concurrency, parent} = options;
	const controller = options.controller ?? new EventEmitter() as ReadDirectoryEventEmitter;
	const progress = options.progress ?? await directoryDeepCount(directoryPath, options);
	controller.emit('progress', progress);
	const limit = pLimit(concurrency);
	const readdir = fsa.promises.readdir ?? FSP.readdir;
	const absolutePath = patha.join(cwd, String(directoryPath));
	const relativePath = patha.relative(cwd, absolutePath);
	const directory = new DirectoryTree(parent, relativePath, absolutePath, []);
	const entryList = await readdir(absolutePath, {withFileTypes: true});

	const promises = entryList.map(entry => limit(async () => {
		const parent = directory;
		const absolutePath = patha.join(entry.parentPath, entry.name);
		const relativePath = patha.relative(cwd, absolutePath);

		if (entry.isDirectory() && !entry.isSymbolicLink()) {
			const data = await streamDirectoryDeepRecursion(relativePath, {
				...options, controller, progress, parent,
			});
			++progress.current;
			controller.emit('progress', progress);
			return data;
		}

		const file = new File(parent, relativePath, absolutePath);
		++progress.current;
		controller.emit('progress', progress);
		controller.emit('data', {target: file, progress});
		return file;
	}));

	const x = await Promise.all(promises);
	const entryPaths = x.map(s => s instanceof File ? s : s.target);
	directory.children.push(...entryPaths);
	const data: ReadDeepStreamData = {target: directory, progress};
	controller.emit('progress', progress);
	controller.emit('data', data);
	return data;
}

export type ReadDirectoryOptions = Pick<RealScanFolderOptions, 'cwd' | 'fsa' | 'patha' | 'concurrency'>;

export function streamDirectoryDeep(directoryPath: string, optionsReal: ReadDirectoryOptions): ReadDirectoryEventEmitter {
	const controller = new EventEmitter() as ReadDirectoryEventEmitter;
	controller.run = async function (): Promise<ReadDeepStreamDataRoot> {
		const data = await streamDirectoryDeepRecursion(directoryPath, {...optionsReal, controller});
		const {progress, target} = data;
		const dataRoot: ReadDeepStreamDataRoot = {progress, tree: target as DirectoryTree};
		controller.emit('end', dataRoot);
		return dataRoot;
	};

	return controller;
}

/**
 * @returns Root directory.
 */
export function readDirectoryDeep(stream: ReadDirectoryEventEmitter): Promise<DirectoryTree>;
export function readDirectoryDeep(directoryPath: string, optionsReal: ReadDirectoryOptions): Promise<DirectoryTree>;
export async function readDirectoryDeep(argument1: string | ReadDirectoryEventEmitter, optionsReal?: ReadDirectoryOptions): Promise<DirectoryTree> {
	const controller = argument1 instanceof EventEmitter ? argument1 : streamDirectoryDeep(argument1, optionsReal!);
	if (typeof argument1 === 'string') {
		const {tree} = await controller.run();
		return tree;
	}

	const tree = await new Promise<DirectoryTree>(resolve => {
		controller.once('end', data => {
			resolve(data.tree);
		});
	});
	return tree;
}
