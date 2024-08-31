import PATH from 'node:path';
import process from 'node:process';
import * as FS from 'node:fs';
import * as FSP from 'node:fs/promises';
import {createRequire} from 'node:module';
import {glob, type FSOption} from 'glob';
import {FileInfo, SourceInfo} from './fs/index.js';
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
 * Uses `readFileSync` and `readFile`.
 * @extends glob.FileSystemAdapter
 */
export type FileSystemAdapter = {
	readFileSync?: typeof FS.readFileSync;
	readdirSync?: typeof FS.readdirSync;
} & FSOption;

// #region scanning

export type IsValidOptions = RealScanFolderOptions & {entry: FS.Dirent; entryPath: string};
/**
 * @returns `true`, if the given source is valid.
 */
export type IsValid = (options: IsValidOptions) => boolean;

export type ReadOptions = RealScanFolderOptions & {sourceInfo: SourceInfo};
/**
 * @returns New scanner. The scanner should tell if the file should be ignored.
 */
export type Read = (options: ReadOptions) => Scanner;

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

export type RealScanFolderOptions = Required<ScanFolderOptions> & {fsa: Required<FileSystemAdapter>};

/**
 * Folder deep scanning options.
 * @see {@link ScanFileOptions}
 */
export type ScanFolderOptions = {

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
 * @throws {ErrorNoSources} if the source is bad.
 * @todo Optimize source searching.
 */
export async function scanPathList(pathList: string[], sources: Methodology[], options?: ScanFolderOptions): Promise<FileInfo[]>;
export async function scanPathList(filePathList: string[], target: string, options?: ScanFolderOptions): Promise<FileInfo[]>;
export async function scanPathList(filePathList: string[], argument1: Methodology[] | string, options?: ScanFolderOptions): Promise<FileInfo[]> {
	if (filePathList.length === 0) {
		throw new ErrorNoSources();
	}

	const optionsReal = realOptions(options);

	if (typeof argument1 === 'string') {
		const bind = targetGet(argument1);
		if (bind === undefined) {
			throw new ErrorTargetNotBound(argument1);
		}

		return scanPathList(filePathList, bind.methodology, Object.assign(optionsReal, bind.scanOptions));
	}

	for (const methodology of argument1) {
		const fileInfoList: FileInfo[] = [];
		let noSource = false;
		let atLeastOneSourceFound: undefined | SourceInfo;
		// eslint-disable-next-line no-await-in-loop
		const cacheDirectorySource = await SourceInfo.createCache(methodology, optionsReal);

		for (const filePath of filePathList) {
			const sourceInfo = cacheDirectorySource.get(filePath);

			if (sourceInfo === undefined) {
				if (atLeastOneSourceFound !== undefined) {
					throw new Error(`Source not found, but expected. File path: ${filePath}. CWD: ${optionsReal.cwd}`);
				}

				noSource = true;
				break;
			}

			atLeastOneSourceFound ??= sourceInfo;

			const readOptions: ReadOptions = {
				...optionsReal,
				sourceInfo,
			};
			const scanner = methodology.readSource(readOptions);
			const fileInfo = new FileInfo(filePath, sourceInfo, scanner.ignores(filePath));

			if (fileInfo.isIncludedBy(optionsReal.filter)) {
				fileInfoList.push(fileInfo);
			}
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

	return scanPathList(await readDirectoryDeep(optionsReal), argument1 as string, options);
}

/**
 * @returns Path list.
 */
export async function readDirectoryDeep(options: Pick<RealScanFolderOptions, 'cwd' | 'fsa' | 'posix'>): Promise<string[]> {
	const allFilePaths: string[] = [];
	const promises: Array<Promise<void>> = [];
	const entryList = await (options.fsa.promises.readdir ?? FSP.readdir)(options.cwd, {withFileTypes: true});
	const path = options.posix ? PATH.posix : PATH;

	for (const entry of entryList) {
		const entryPathAbsolute = path.join(entry.parentPath, entry.name);
		const entryPath = path.relative(options.cwd, entryPathAbsolute);
		if (entry.isSymbolicLink()) {
			continue;
		}

		if (entry.isDirectory()) {
			const reader = new Promise<void>((resolve, reject) => {
				const read = readDirectoryDeep({...options, cwd: entryPathAbsolute});
				read.then(
					subEntryList => {
						subEntryList = subEntryList.map(
							subEntry => path.join(entryPath, subEntry),
						);
						allFilePaths.push(...subEntryList);
						resolve();
					},
				).catch(reject);
			});
			promises.push(reader);
			continue;
		}

		if (!entry.isFile()) {
			continue;
		}

		allFilePaths.push(entryPath);
	}

	await Promise.all(promises);

	return allFilePaths;
}

/**
 * @returns Usable options object.
 */
export function realOptions(options?: ScanFolderOptions): RealScanFolderOptions {
	options ??= {};
	const optionsReal: RealScanFolderOptions = {
		...options,
		cwd: options.cwd ?? process.cwd(),
		filter: options.filter ?? 'included',
		fsa: (options.fsa ?? FS) as Required<FileSystemAdapter>,
		maxDepth: options.maxDepth ?? Infinity,
		posix: options.posix ?? false,
	};
	return optionsReal;
}
// #endregion
