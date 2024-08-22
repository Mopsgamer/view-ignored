import path from 'node:path';
import process from 'node:process';
import type * as FS from 'node:fs';
import {createRequire} from 'node:module';
import {glob, type FSOption} from 'glob';
import {FileInfo} from './fileinfo.js';
import {SourceInfo} from './sourceinfo.js';
import {targetGet} from './binds/index.js';
import {ErrorNoSources, ErrorTargetNotBound} from './errors.js';

export * from './errors.js';
export * from './fileinfo.js';
export * from './sourceinfo.js';
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
/**
 * @returns `true`, if the given source is valid.
 */
export type IsValid = (sourceInfo: SourceInfo) => boolean;

/**
 * The custom scanner.
 */
export type Scanner = {
	/**
	 * @returns `true`, if the given path is ignored.
	 */
	ignores(path: string): boolean;
};

export type Read = (sourceInfo: SourceInfo) => Scanner;

/**
 * Represents the methodology for reading the target's source.
 */
export type Methodology = {

	/**
	 * First valid source will be used as {@link Scanner}.
	 */
	pattern: SourceInfo[] | string[] | SourceInfo | string;

	/**
	 * Scanner function. Should return `true`, if the given source is valid.
	 */
	isValidSource: IsValid;

	read: Read;
};

/**
 * Checks if the value is the {@link Methodology}.
 */
export function isMethodology(value: unknown): value is Methodology {
	if (value?.constructor !== Object) {
		return false;
	}

	const v = value as Partial<Methodology>;

	const check: boolean = (v.isValidSource === undefined || typeof v.isValidSource === 'function')
		&& (v.read === undefined || typeof v.read === 'function')
		&& (v.pattern === undefined || typeof v.pattern === 'string' || v.pattern instanceof SourceInfo || (Array.isArray(v.pattern) && (v.pattern.every(p => typeof p === 'string') || v.pattern.every(p => p instanceof SourceInfo))));
	return check;
}

/**
 * File scanning options.
 * @see {@link ScanFolderOptions}
 */
export type ScanFileOptions = {
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
};

/**
 * Folder deep scanning options.
 * @see {@link ScanFileOptions}
 */
export type ScanFolderOptions = ScanFileOptions & {
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
 * Gets info about the file: it is ignored or not.
 * @throws {ErrorNoSources} if the source is bad.
 */
export async function scanFile(filePath: string, sources: Methodology[], options?: ScanFileOptions): Promise<FileInfo> {
	const [fileInfo] = await scanFileList([filePath], sources, options);
	return fileInfo;
}

/**
 * Gets info about the each file: it is ignored or not.
 * @throws {ErrorNoSources} if the source is bad.
 */
export async function scanFileList(filePathList: string[], sources: Methodology[], options?: ScanFolderOptions): Promise<FileInfo[]>;
export async function scanFileList(filePathList: string[], target: string, options?: ScanFolderOptions): Promise<FileInfo[]>;
export async function scanFileList(filePathList: string[], argument1: Methodology[] | string, options?: ScanFolderOptions): Promise<FileInfo[]> {
	options ??= {};
	const {filter = 'included'} = options;
	if (typeof argument1 === 'string') {
		const bind = targetGet(argument1);
		if (bind === undefined) {
			throw new ErrorTargetNotBound(argument1);
		}

		return scanFileList(filePathList, bind.methodology, Object.assign(options, bind.scanOptions));
	}

	for (const methodology of argument1) {
		const fileInfoList: FileInfo[] = [];
		let noSource = false;
		const cacheDirectorySource = new Map<string, SourceInfo>();
		const cacheSourceValid = new Map<SourceInfo, boolean>();
		// eslint-disable-next-line no-await-in-loop
		const sourceInfoList = await SourceInfo.from(methodology, options);

		for (const filePath of filePathList) {
			const fileDirectory = path.dirname(filePath);
			const sourceInfo = cacheDirectorySource.get(fileDirectory) ?? SourceInfo.hierarchy(
				fileDirectory,
				sourceInfoList,
				{
					closest: true,
					filter(sourceInfo) {
						let isValid = cacheSourceValid.get(sourceInfo);
						if (isValid === undefined) {
							cacheSourceValid.set(sourceInfo, isValid = methodology.isValidSource(sourceInfo));
						}

						return isValid;
					},
				},
			);

			if (sourceInfo === undefined) {
				noSource = true;
				break;
			}

			cacheDirectorySource.set(fileDirectory, sourceInfo);

			const scanner = methodology.read(sourceInfo);
			const fileInfo = new FileInfo(filePath, sourceInfo, scanner.ignores(filePath));

			if (fileInfo.isIncludedBy(filter)) {
				fileInfoList.push(fileInfo);
			}
		}

		if (noSource) {
			continue;
		}

		return fileInfoList;
	}

	throw new ErrorNoSources(argument1);
}

/**
 * Scans project's directory paths to determine whether they are being ignored.
 * @throws {ErrorNoSources} if the source is bad.
 */
export async function scanFolder(folderPath: string, sources: Methodology[], options?: ScanFolderOptions): Promise<FileInfo[]>;
export async function scanFolder(folderPath: string, target: string, options?: ScanFolderOptions): Promise<FileInfo[]>;
export async function scanFolder(folderPath: string, argument1: Methodology[] | string, options?: ScanFolderOptions): Promise<FileInfo[]> {
	options ??= {};
	if (typeof argument1 === 'string') {
		return scanFolder(folderPath, argument1, options);
	}

	const {fsa, cwd = process.cwd(), posix = false, maxDepth = Infinity} = options;

	const allFilePaths = await glob('**', {
		cwd,
		posix,
		maxDepth,
		fs: fsa,
		nodir: true,
		dot: true,
	});

	return scanFileList(allFilePaths, argument1, options);
}
// #endregion
