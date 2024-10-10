/* eslint-disable unicorn/prefer-event-target */
import {
	join, parse, relative, type ParsedPath,
} from 'node:path';
import EventEmitter from 'node:events';
import * as FSP from 'node:fs/promises';
import process from 'node:process';
import pLimit from 'p-limit';
import {type RealScanOptions} from '../lib.js';
import {configDefault} from '../../config.js';
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
	target: Entry;
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

export type DeepStream = ReadableStream<Entry>;

type DeepStreamNestedOptions = DeepStreamOptions & {
	controller?: DeepStreamEventEmitter;
	parent?: Directory;
	progress?: DeepStreamProgress;
};

export type DeepCountOptions = Pick<DeepStreamNestedOptions, 'modules' | 'cwd' | 'concurrency' | 'progress'>;
export type DeepModifiedTimeOptions = Pick<RealScanOptions, 'concurrency' | 'modules'>;
export type DeepStreamOptions = Pick<RealScanOptions, 'cwd' | 'modules' | 'concurrency'>;

export type Entry = Directory | File;
export type EntryClass = typeof Directory | typeof File;
export type EntryInstanceFrom<T extends undefined | EntryClass> = T extends undefined ? Entry : T extends typeof Directory ? Directory : File;

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
			modules, cwd, concurrency, progress = {
				current: 0, total: 0, files: 0, directories: 0,
			},
		} = options;
		const limit = pLimit(concurrency);
		const readdir = modules.fs.promises.readdir ?? FSP.readdir;
		const absolutePath = modules.path.join(cwd, String(directoryPath));
		const entryList = await readdir(absolutePath, {withFileTypes: true});

		const promises = entryList.map(entry => limit(async () => {
			++progress.total;
			if (entry.isDirectory() && !entry.isSymbolicLink()) {
				const absolutePath = modules.path.join(entry.parentPath, entry.name);
				const relativePath = modules.path.relative(cwd, absolutePath);
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
		const tree = new Directory(undefined, '.', cwd, new Map());

		for (const path of pathList) {
			const entryNameList = path.toString().split(/[\\/]/);
			// eslint-disable-next-line unicorn/no-array-reduce
			entryNameList.reduce((tree, entryName, index) => {
				const absolutePath = join(tree.absolutePath, entryName);
				const relativePath = relative(cwd, absolutePath);

				if (index === entryNameList.length - 1) {
					const file = new File(tree, relativePath, absolutePath);
					tree.set(file.base, file);
					return tree;
				}

				let directory = Array.from(tree.children.values()).find(
					c => c instanceof Directory && c.absolutePath === absolutePath,
				) as Directory | undefined;
				if (directory === undefined) {
					directory = new Directory(tree, relativePath, absolutePath, new Map());
					tree.set(`${directory.base}/`, directory);
				}

				return directory;
			}, tree);
		}

		return tree;
	}

	/**
	 * Get deep iterator for the directory.
	 */
	public static deepIterator = function * <T extends undefined | EntryClass>(
		directory: Directory, instanceOf?: T,
	): IterableIterator<EntryInstanceFrom<T>> {
		const subDirectories: Directory[] = [];
		for (const element of directory.children.values()) {
			if (instanceOf === undefined || element instanceof instanceOf) {
				yield element as EntryInstanceFrom<T>;
			}

			if (element instanceof Directory) {
				subDirectories.push(element);
			}
		}

		for (const subDirectory of subDirectories) {
			yield * Directory.deepIterator(subDirectory);
		}
	};

	/**
	 * Read directories and files progressively.
	 * @private This function should be wrapped by {@link deepStream}.
	 * @param directoryPath Relative path to the directory.
	 * @param options The reader options.
	 */
	private static async deepStreamNested(directoryPath: {toString(): string}, options: DeepStreamNestedOptions): Promise<DeepStreamData> {
		const {modules, cwd, concurrency, parent} = options;
		const controller = options.controller ?? new EventEmitter() as DeepStreamEventEmitter;
		const progress = options.progress ?? await Directory.deepCount(directoryPath, options);
		controller.emit('progress', progress);
		const limit = pLimit(concurrency);
		const readdir = modules.fs.promises.readdir ?? FSP.readdir;
		const absolutePath = modules.path.join(cwd, String(directoryPath));
		const relativePath = modules.path.relative(cwd, absolutePath);
		const directory = new Directory(parent, relativePath, absolutePath, new Map());
		const entryList = await readdir(absolutePath, {withFileTypes: true});

		const promises = entryList.map(entry => limit(async (): Promise<DeepStreamData> => {
			const parent = directory;
			const absolutePath = modules.path.join(entry.parentPath, entry.name);
			const relativePath = modules.path.relative(cwd, absolutePath);

			if (entry.isDirectory() && !entry.isSymbolicLink()) {
				const data = await Directory.deepStreamNested(relativePath, {
					...options, controller, progress, parent,
				});
				++progress.current;
				controller.emit('progress', progress);
				return data;
			}

			const file = new File(parent, relativePath, absolutePath);
			const data: DeepStreamData = {target: file, progress};
			++progress.current;
			controller.emit('progress', progress);
			controller.emit('data', data);
			return data;
		}));

		const dataList = await Promise.all(promises);
		for (const {target: entry} of dataList) {
			directory.children.set(`${entry.base}${entry instanceof Directory ? '/' : ''}`, entry);
		}

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
         * The content of the directory. It is a Map for performance reasons: you can find any file or folder without a loop if you know the name.
		 *
		 * Keys: {@link File.base} or {@link Directory.base}. Directory base ends with '/'.
		 *
		 * Values: {@link File} or {@link Directory} itself.
         */
		public readonly children: Map<string, Entry>,
	) {
		const parsed = parse(absolutePath);
		this.base = parsed.base;
		this.dir = parsed.dir;
		this.ext = parsed.ext;
		this.name = parsed.name;
		this.root = parsed.root;
	}

	/**
	 * @param instanceOf Optionally filter children by type.
	 */
	deepIterator<T extends undefined | typeof File | typeof Directory>(instanceOf?: T) {
		return Directory.deepIterator<T>(this, instanceOf);
	}

	/**
	 * @param instanceOf Optionally filter children by type.
	 */
	deep<T extends undefined | typeof File | typeof Directory>(instanceOf?: T) {
		return Array.from(Directory.deepIterator<T>(this, instanceOf));
	}

	/**
	 * @returns The relative path to the directory.
	 */
	toString(): string {
		return this.relativePath;
	}

	get<T extends string>(key: T): (T extends `${string}/` ? Directory : File) | undefined {
		return this.children.get(key) as (T extends `${string}/` ? Directory : File) | undefined;
	}

	set<T extends string>(key: T, value: (T extends `${string}/` ? Directory : File)): typeof this.children {
		return this.children.set(key, value);
	}

	/**
	 * @returns The cache for each file of the directory with last time edited number.
	 * @see {@link modified}.
	 */
	async deepModifiedTime(out: Map<File, number>, realOptions: DeepModifiedTimeOptions): Promise<Map<File, number>> {
		const {concurrency = configDefault.concurrency, modules} = realOptions;
		const limit = pLimit(concurrency);
		const promiseList: Array<Promise<void>> = [];
		for (const entry of this.deepIterator()) {
			if (entry instanceof Directory) {
				continue;
			}

			promiseList.push(limit(async () => {
				const fileStat = await modules.fs.promises.stat(entry.absolutePath);
				out.set(entry, fileStat.mtime.getTime());
			}));
		}

		void await Promise.all(promiseList);

		return out;
	}
}
