/* eslint-disable unicorn/prefer-event-target */
import {
	join, parse, relative, type ParsedPath,
} from 'node:path';
import EventEmitter from 'node:events';
import * as FSP from 'node:fs/promises';
import process from 'node:process';
import pLimit from 'p-limit';
import {type RealScanOptions} from '../lib.js';
import {File} from './file.js';

export type DeepStreamEventEmitter = EventEmitter<DeepStreamEventMap> & {
	endPromise: Promise<DeepStreamDataRoot>;
	run(): void;
};

export type DeepStreamDataRoot = {
	tree: Directory;
	progress: DeepStreamProgress;
};
export type DeepStreamData = {
	target: Directory | File;
	progress: DeepStreamProgress;
};

export type DeepStreamProgress = {
	directories: number;
	files: number;
	current: number;
	total: number;
};

export type DeepStreamEventMap = {
	'data': [DeepStreamData];
	'end': [DeepStreamDataRoot];
	'progress': [DeepStreamProgress];
};

export type DeepStream = ReadableStream<File | Directory>;

type DeepStreamNestedOptions = DeepStreamOptions & {
	controller?: DeepStreamEventEmitter;
	parent?: Directory;
	progress?: DeepStreamProgress;
};

export type DeepCountOptions = Pick<DeepStreamNestedOptions, 'fsa' | 'patha' | 'cwd' | 'concurrency' | 'progress'>;

export type DeepStreamOptions = Pick<RealScanOptions, 'cwd' | 'fsa' | 'patha' | 'concurrency'>;

/**
 * File system directory representation.
 */
export class Directory implements ParsedPath {
	/**
	 * Get the number of directories and files.
	 * @param directoryPath Relative path to the directory.
	 * @param options The counter and reader options.
	 */
	static async deepCount(directoryPath: {toString(): string}, options: DeepCountOptions): Promise<DeepStreamProgress> {
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
				await Directory.deepCount(relativePath, {...options, progress});
				++progress.directories;
				return;
			}

			++progress.files;
		}));

		await Promise.all(promises);
		return progress;
	}

	/**
	 * Read directories and files progressively.
	 * @param directoryPath Relative path to the directory.
	 * @param options The reader options.
	 */
	static deepStream(directoryPath: string, optionsReal: DeepStreamOptions): DeepStreamEventEmitter {
		const controller = new EventEmitter() as DeepStreamEventEmitter;
		controller.endPromise = new Promise<DeepStreamDataRoot>(resolve => {
			controller.once('end', data => {
				resolve(data);
			});
		});
		controller.run = async function (): Promise<DeepStreamDataRoot> {
			const data = await Directory.deepStreamNested(directoryPath, {...optionsReal, controller});
			const {progress, target} = data;
			const dataRoot: DeepStreamDataRoot = {progress, tree: target as Directory};
			controller.emit('end', dataRoot);
			return dataRoot;
		};

		return controller;
	}

	/**
	 * Get the {@link Directory} instance from a file path list. Paths should be relative.
	 */
	static from(pathList: Array<{toString(): string}>, cwd: string = process.cwd()): Directory {
		const tree = new Directory(undefined, '.', cwd, []);

		for (const path of pathList) {
			const entryNameList = path.toString().split(/[\\/]/);
			// eslint-disable-next-line unicorn/no-array-reduce
			entryNameList.reduce((tree, entryName, index) => {
				const absolutePath = join(tree.absolutePath, entryName);
				const relativePath = relative(cwd, absolutePath);

				if (index === entryNameList.length - 1) {
					const file = new File(tree, relativePath, absolutePath);
					tree.children.push(file);
					return tree;
				}

				let directory = tree.children.find(
					c => c instanceof Directory && c.absolutePath === absolutePath,
				) as Directory | undefined;
				if (directory === undefined) {
					directory = new Directory(tree, relativePath, absolutePath, []);
					tree.children.push(directory);
				}

				return directory;
			}, tree);
		}

		return tree;
	}

	protected static getIterator = function * (directory: Directory): IterableIterator<Directory | File> {
		for (const element of directory.children) {
			yield element;
			if (element instanceof Directory) {
				yield * Directory.getIterator(element);
			}
		}
	};

	/**
	 * Read directories and files progressively.
	 * @private This function should be wrapped by {@link deepStream}.
	 * @param directoryPath Relative path to the directory.
	 * @param options The reader options.
	 */
	private static async deepStreamNested(directoryPath: {toString(): string}, options: DeepStreamNestedOptions): Promise<DeepStreamData> {
		const {fsa, patha, cwd, concurrency, parent} = options;
		const controller = options.controller ?? new EventEmitter() as DeepStreamEventEmitter;
		const progress = options.progress ?? await Directory.deepCount(directoryPath, options);
		controller.emit('progress', progress);
		const limit = pLimit(concurrency);
		const readdir = fsa.promises.readdir ?? FSP.readdir;
		const absolutePath = patha.join(cwd, String(directoryPath));
		const relativePath = patha.relative(cwd, absolutePath);
		const directory = new Directory(parent, relativePath, absolutePath, []);
		const entryList = await readdir(absolutePath, {withFileTypes: true});

		const promises = entryList.map(entry => limit(async () => {
			const parent = directory;
			const absolutePath = patha.join(entry.parentPath, entry.name);
			const relativePath = patha.relative(cwd, absolutePath);

			if (entry.isDirectory() && !entry.isSymbolicLink()) {
				const data = await Directory.deepStreamNested(relativePath, {
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
		const data: DeepStreamData = {target: directory, progress};
		controller.emit('progress', progress);
		controller.emit('data', data);
		return data;
	}

	public readonly base: string;
	public readonly dir: string;
	public readonly ext: string;
	public readonly name: string;
	public readonly root: string;
	constructor(
		/**
         * The parent of the directory.
         */
		public readonly parent: Directory | undefined,

		/**
         * The relative path to the directory.
         */
		public readonly relativePath: string,

		/**
		 * The absolute path to the file.
		 */
		public readonly absolutePath: string,

		/**
         * The content of the directory.
         */
		public readonly children: Array<Directory | File>,
	) {
		const parsed = parse(absolutePath);
		this.base = parsed.base;
		this.dir = parsed.dir;
		this.ext = parsed.ext;
		this.name = parsed.name;
		this.root = parsed.root;
	}

	[Symbol.iterator] = () => Directory.getIterator(this);

	/**
	 * @returns The relative path to the directory.
	 */
	toString(): string {
		return this.relativePath;
	}
}
