import * as PATH from 'node:path';
import process from 'node:process';
import * as FS from 'node:fs';
import {createRequire} from 'node:module';
import {
	File, FileInfo, readDirectoryDeep, SourceInfo,
} from './fs/index.js';
import {targetGet} from './binds/index.js';
import {ErrorNoSources, ErrorTargetNotBound} from './errors.js';

export * from './errors.js';
export * from './fs/index.js';
export * as Styling from './styling.js';
export * as Sorting from './sorting.js';
export * as Plugins from './binds/index.js';

// eslint-disable-next-line @typescript-eslint/consistent-type-imports
export const package_ = createRequire(import.meta.url)('../../package.json') as typeof import('../../package.json');

/**
 * Contains all filter names.
 */
export const filterNameList = ['ignored', 'included', 'all'] as const;
/**
 * Contains all filter names as a type.
 */
export type FilterName = typeof filterNameList[number];
/**
 * Checks if the value is the {@link FilterName}.
 */
export function isFilterName(value: unknown): value is FilterName {
	return typeof value === 'string' && filterNameList.includes(value as FilterName);
}

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
export type IsValid = (options: RealScanFolderOptions, source: File) => boolean;

/**
 * @returns New scanner. The scanner should tell if the file should be ignored.
 */
export type Read = (options: RealScanFolderOptions, source: SourceInfo) => Scanner;

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
	findSource: IsValid;

	/**
	 * @returns New source scanner. The scanner should tell if the file should be ignored.
	 */
	readSource: Read;
};

/**
 * Checks if the value is the {@link Methodology}.
 */
export function isMethodology(value: unknown): value is Methodology {
	if (value?.constructor !== Object) {
		return false;
	}

	const v = value as Partial<Methodology>;

	const check: boolean = (v.findSource === undefined || typeof v.findSource === 'function')
		&& (v.readSource === undefined || typeof v.readSource === 'function');
	return check;
}

export type RealScanFolderOptions = Required<ScanFolderOptions> & {
	fsa: Required<FileSystemAdapter>;
	patha: PATH.PlatformPath;
};

/**
 * Folder deep scanning options.
 * @see {@link ScanFileOptions}
 */
export type ScanFolderOptions = {

	/**
	 * The max concurrency for file-system operations.
	 * @default 4
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
 * @throws {ErrorNoSources} if the source is bad.
 * @todo Optimize source searching.
 */
export async function scanPathList(pathList: Array<{toString(): string}>, sources: Methodology[], options?: ScanFolderOptions): Promise<FileInfo[]>;
export async function scanPathList(pathList: Array<{toString(): string}>, target: string, options?: ScanFolderOptions): Promise<FileInfo[]>;
export async function scanPathList(pathList: Array<{toString(): string}>, argument1: Methodology[] | string, options?: ScanFolderOptions): Promise<FileInfo[]> {
	if (pathList.length === 0) {
		throw new ErrorNoSources();
	}

	options ??= {};
	if (typeof argument1 === 'string') {
		const bind = targetGet(argument1);
		if (bind === undefined) {
			throw new ErrorTargetNotBound(argument1);
		}

		return scanPathList(pathList, bind.methodology, Object.assign(options, bind.scanOptions));
	}

	const optionsReal = realOptions(options);

	for (const methodology of argument1) {
		const fileInfoList: FileInfo[] = [];
		let noSource = false;
		let atLeastOneSourceFound: undefined | SourceInfo;
		// eslint-disable-next-line no-await-in-loop
		const cache = await SourceInfo.createCache(methodology, optionsReal);
		const cacheRead = new Map<SourceInfo, Scanner>();

		for (const pathItem of pathList) {
			const relativePath = String(pathItem);
			const absolutePath = pathItem instanceof File ? pathItem.absolutePath : optionsReal.patha.join(optionsReal.cwd, relativePath);
			const sourceInfo = cache.get(relativePath);

			if (sourceInfo === undefined) {
				if (atLeastOneSourceFound !== undefined) {
					throw new Error(`Source not found, but expected. File path: ${relativePath}. CWD: ${optionsReal.cwd}`);
				}

				noSource = true;
				break;
			}

			atLeastOneSourceFound ??= sourceInfo;

			let scanner = cacheRead.get(sourceInfo);
			if (!scanner) {
				cacheRead.set(sourceInfo, scanner = methodology.readSource(optionsReal, sourceInfo));
			}

			const fileInfo = new FileInfo(relativePath, absolutePath, sourceInfo, scanner.ignores(relativePath));
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
	const direntPaths = direntTree.flat().map(String);

	return scanPathList(direntPaths, argument1 as string, options);
}

/**
 * @returns Usable options object.
 */
export function realOptions(options?: ScanFolderOptions): RealScanFolderOptions {
	options ??= {};
	const posix = options.posix ?? false;
	const concurrency = options.concurrency ?? 4;
	const optionsReal: RealScanFolderOptions = {
		concurrency,
		cwd: options.cwd ?? process.cwd(),
		filter: options.filter ?? 'included',
		fsa: (options.fsa ?? FS) as Required<FileSystemAdapter>,
		patha: posix ? PATH.posix : PATH,
		maxDepth: options.maxDepth ?? Infinity,
		posix,
	};
	return optionsReal;
}
// #endregion
