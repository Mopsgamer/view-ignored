import * as PATH from 'node:path';
import process from 'node:process';
import * as FS from 'node:fs';
import {createRequire} from 'node:module';
import {configDefault} from '../config.js';
import {
	Directory,
	type File, FileInfo, SourceInfo,
} from './fs/index.js';
import {targetGet} from './binds/index.js';
import {ErrorTargetNotBound, SomeError} from './errors.js';
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
 * The custom scanner.
 */
export type Scanner = {
	/**
	 * @returns `true`, if the given path is ignored.
	 */
	ignores(path: string): boolean;
};

/**
 * Recursively creates a cache scanner for each file.
 * @throws If the target does not allow the current ignore configurations: {@link SomeError}.
 * For example, {@link https://www.npmjs.com/package/@vscode/vsce vsce} considers it invalid if your manifest is missing the 'engines' field.
 * Similarly, npm will raise an error if you attempt to publish a package without a basic 'package.json'.
 * This exception can be ignored if the {@link ScanOptions.defaultScanner} option is specified.
 */
export type Methodology = (tree: Directory, realOptions: RealScanFolderOptions) => Map<File, SourceInfo>;

export type RealScanFolderOptions = Required<Omit<ScanOptions, 'defaultScanner'>> & {
	defaultScanner?: Scanner | undefined;
	fsa: Required<FileSystemAdapter>;
	patha: PATH.PlatformPath;
};

/**
 * Folder deep scanning options.
 * @see {@link ScanFileOptions}
 */
export type ScanOptions = {

	/**
	 * The target or the scan methodology.
	 */
	target?: string | Methodology;

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
 * @throws If no valid sources: {@link ErrorNoSources}.
 * This exception can be ignored if the {@link ScanOptions.defaultScanner} option is specified.
 */
export async function scan(directoryPath: string, options?: ScanOptions): Promise<FileInfo[]>;
export async function scan(directory: Directory, options?: ScanOptions): Promise<FileInfo[]>;
export async function scan(pathList: string[], options?: ScanOptions): Promise<FileInfo[]>;
export async function scan(argument0: string | string[] | Directory, options?: ScanOptions): Promise<FileInfo[]> {
	options ??= {};
	const optionsReal = makeOptionsReal(options);

	if (typeof optionsReal.target === 'string') {
		const bind = targetGet(optionsReal.target);
		if (bind === undefined) {
			throw new ErrorTargetNotBound(optionsReal.target);
		}

		return scan(argument0 as Directory, Object.assign(options, bind.scanOptions));
	}

	if (typeof argument0 === 'string') {
		return scan(await Directory.deepRead(argument0, optionsReal), options);
	}

	if (Array.isArray(argument0)) {
		const tree: Directory = Directory.from(argument0, optionsReal.cwd);
		return scan(tree, options);
	}

	const fileList = argument0.flat();
	let cache: Map<File, SourceInfo>;
	try {
		cache = optionsReal.target(argument0, optionsReal);
	} catch (error) {
		if (!(error instanceof SomeError) || optionsReal.defaultScanner === undefined) {
			throw error;
		}

		const fileInfoList: FileInfo[] = [];
		for (const entry of fileList) {
			const defaultSourceInfo = new SourceInfo(argument0, '(default)', '(default)', optionsReal.defaultScanner);
			const fileInfo = FileInfo.from(entry, defaultSourceInfo);
			const ignored = !fileInfo.isIncludedBy(optionsReal.filter);

			if (ignored) {
				continue;
			}

			fileInfoList.push(fileInfo);
		}

		return fileInfoList;
	}

	const fileInfoList: FileInfo[] = [];
	for (const entry of fileList) {
		const sourceInfo = cache.get(entry);

		if (sourceInfo === undefined) {
			throw new SomeError(`Invalid methodology. Cannot get scanner for ${entry.relativePath}`);
		}

		const fileInfo = FileInfo.from(entry, sourceInfo);
		const ignored = !fileInfo.isIncludedBy(optionsReal.filter);

		if (ignored) {
			continue;
		}

		fileInfoList.push(fileInfo);
	}

	return fileInfoList;
}

/**
 * @returns Usable options object.
 */
export function makeOptionsReal(options?: ScanOptions): RealScanFolderOptions {
	options ??= {};
	const posix = options.posix ?? false;
	const concurrency = options.concurrency ?? configDefault.concurrency;
	const optionsReal: RealScanFolderOptions = {
		concurrency,
		target: options.target ?? 'git',
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
