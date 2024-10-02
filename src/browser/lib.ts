import * as PATH from 'node:path';
import process from 'node:process';
import * as FS from 'node:fs';
import {createRequire} from 'node:module';
import {configDefault} from '../config.js';
import {
	DirectoryTree,
	File, FileInfo, readDirectoryDeep, SourceInfo,
} from './fs/index.js';
import {targetGet} from './binds/index.js';
import {ErrorNoSources, ErrorTargetNotBound} from './errors.js';
import {type FilterName} from './filtering.js';

export * from './errors.js';
export * from './fs/index.js';
export * as Filtering from './filtering.js';
export * as Styling from './styling.js';
export * as Sorting from './sorting.js';
export * as Plugins from './binds/index.js';

// eslint-disable-next-line @typescript-eslint/consistent-type-imports
export const package_ = createRequire(import.meta.url)('../../package.json') as typeof import('../../package.json');

/**
 * Uses `node:fs` and `node:fs/promises` be default.
 */
export type FileSystemAdapter = {
	readFileSync?: typeof FS.readFileSync;
	readdirSync?: typeof FS.readdirSync;
	promises?: {
		readdir(path: string, options: {withFileTypes: true}): Promise<FS.Dirent[]>;
	};
};

// #region scanning

/**
 * @returns `true`, if the given source is valid.
 */
export type FindSource = (options: RealScanFolderOptions, source: File) => boolean;

/**
 * @returns New scanner. The scanner should tell if the file should be ignored.
 */
export type ReadSource = (options: RealScanFolderOptions, source: SourceInfo) => Scanner;

/**
 * The custom scanner.
 */
export type Scanner = {
	/**
	 * @returns `true`, if the given path is ignored.
	 */
	ignores(path: string): boolean;
};

/**
 * Represents the methodology for reading the target's source.
 */
export type Methodology = {

	/**
	 * @returns `true`, if the given source is valid.
	 */
	findSource: FindSource;

	/**
	 * @returns New source scanner. The scanner should tell if the file should be ignored.
	 */
	readSource: ReadSource;
};

/**
 * Checks if the value is the {@link Methodology}.
 */
export function isMethodology(value: unknown): value is Methodology {
	return value?.constructor === Object;
}

export type RealScanFolderOptions = Required<Omit<ScanFolderOptions, 'defaultScanner'>> & {
	defaultScanner?: Scanner | undefined;
	fsa: Required<FileSystemAdapter>;
	patha: PATH.PlatformPath;
};

/**
 * Folder deep scanning options.
 * @see {@link ScanFileOptions}
 */
export type ScanFolderOptions = {

	/**
	 * The default scanner if the methodology could not find any sources.
	 * @default undefined
	 */
	defaultScanner?: Scanner;

	/**
	 * The max concurrency for file-system operations.
	 * @default 8
	 */
	concurrency?: number;

	/**
	 * Custom implementation of methods for working with the file system.
	 * @default import * as FS from "fs"
	 */
	fsa?: FileSystemAdapter;

	/**
	 * The current working directory in which to search.
	 * @default process.cwd()
	 */
	cwd?: string;

	/**
	 * Specifies the maximum depth of a read directory relative to the start
	 * directory.
	 * @default Infinity
	 */
	maxDepth?: number;

	/**
	 * On posix systems, this has no effect.  But, on Windows, it means that
	 * paths will be `/` delimited, and absolute paths will be their full
	 * resolved UNC forms, eg instead of `'C:\\foo\\bar'`, it would return
	 * `'//?/C:/foo/bar'`
	 * @default false
     * @returns `/` delimited paths, even on Windows.
     */
	posix?: boolean;

	/**
	 * Filter output.
	 * @default "included"
	 */
	filter?: FilterName | ((fileInfo: FileInfo) => boolean);
};

/**
 * Gets info about the each file: it is ignored or not.
 * @param pathList The list of relative paths. The should be relative to the current working directory.
 * @throws {ErrorNoSources} if no sources found.
 * @todo Optimize source searching.
 */
export async function scanPathList(tree: DirectoryTree, sources: Methodology[], options?: ScanFolderOptions): Promise<FileInfo[]>;
export async function scanPathList(tree: DirectoryTree, target: string, options?: ScanFolderOptions): Promise<FileInfo[]>;
export async function scanPathList(pathList: Array<{toString(): string}>, sources: Methodology[], options?: ScanFolderOptions): Promise<FileInfo[]>;
export async function scanPathList(pathList: Array<{toString(): string}>, target: string, options?: ScanFolderOptions): Promise<FileInfo[]>;
export async function scanPathList(argument0: Array<{toString(): string}> | DirectoryTree, argument1: Methodology[] | string, options?: ScanFolderOptions): Promise<FileInfo[]> {
	options ??= {};

	if (typeof argument1 === 'string') {
		const bind = targetGet(argument1);
		if (bind === undefined) {
			throw new ErrorTargetNotBound(argument1);
		}

		return scanPathList(argument0 as DirectoryTree, bind.methodology, Object.assign(options, bind.scanOptions));
	}

	const optionsReal = realOptions(options);
	if (Array.isArray(argument0)) {
		const tree: DirectoryTree = DirectoryTree.from(argument0, optionsReal.cwd);
		return scanPathList(tree, argument1, options);
	}

	const fileList = argument0.flat();

	for (const methodology of argument1) {
		const fileInfoList: FileInfo[] = [];
		let noSource = false;
		let atLeastOneSourceFound: undefined | SourceInfo;
		// eslint-disable-next-line no-await-in-loop
		const cache = await SourceInfo.createCache(argument0, methodology, optionsReal);
		const cacheRead = new Map<SourceInfo, Scanner>();

		for (const entry of fileList) {
			const sourceInfo = cache.get(entry.relativePath);

			if (sourceInfo === undefined) {
				if (atLeastOneSourceFound !== undefined) {
					throw new Error(`Source not found, but expected. File path: ${entry.relativePath}. CWD: ${optionsReal.cwd}`);
				}

				noSource = true;
				break;
			}

			atLeastOneSourceFound ??= sourceInfo;

			let scanner = cacheRead.get(sourceInfo);
			if (!scanner) {
				cacheRead.set(sourceInfo, scanner = methodology.readSource(optionsReal, sourceInfo));
			}

			const fileInfo = new FileInfo(entry.relativePath, entry.absolutePath, sourceInfo, scanner.ignores(entry.relativePath));
			const ignored = !fileInfo.isIncludedBy(optionsReal.filter);

			if (ignored) {
				continue;
			}

			fileInfoList.push(fileInfo);
		}

		if (noSource) {
			continue;
		}

		return fileInfoList;
	}

	if (optionsReal.defaultScanner !== undefined) {
		const fileInfoList: FileInfo[] = [];
		for (const entry of fileList) {
			const relativePath = String(entry);
			const absolutePath = entry instanceof File ? entry.absolutePath : optionsReal.patha.join(optionsReal.cwd, relativePath);
			const fileInfo = new FileInfo(relativePath, absolutePath, optionsReal.defaultScanner, optionsReal.defaultScanner.ignores(relativePath));
			const ignored = !fileInfo.isIncludedBy(optionsReal.filter);

			if (ignored) {
				continue;
			}

			fileInfoList.push(fileInfo);
		}

		return fileInfoList;
	}

	throw new ErrorNoSources();
}

/**
 * Scans project's directory paths to determine whether they are being ignored.
 * @throws {ErrorNoSources} if the source is bad.
 */
export async function scanFolder(sources: Methodology[], options?: ScanFolderOptions): Promise<FileInfo[]>;
export async function scanFolder(target: string, options?: ScanFolderOptions): Promise<FileInfo[]>;
export async function scanFolder(argument1: Methodology[] | string, options?: ScanFolderOptions): Promise<FileInfo[]> {
	const optionsReal = realOptions(options);
	const direntTree = await readDirectoryDeep('.', optionsReal);

	return scanPathList(direntTree, argument1 as string, options);
}

/**
 * @returns Usable options object.
 */
export function realOptions(options?: ScanFolderOptions): RealScanFolderOptions {
	options ??= {};
	const posix = options.posix ?? false;
	const concurrency = options.concurrency ?? configDefault.concurrency;
	const optionsReal: RealScanFolderOptions = {
		concurrency,
		defaultScanner: options.defaultScanner,
		cwd: options.cwd ?? process.cwd(),
		filter: options.filter ?? configDefault.filter,
		fsa: (options.fsa ?? FS) as Required<FileSystemAdapter>,
		patha: posix ? PATH.posix : PATH,
		maxDepth: options.maxDepth ?? configDefault.depth,
		posix,
	};
	return optionsReal;
}
// #endregion
