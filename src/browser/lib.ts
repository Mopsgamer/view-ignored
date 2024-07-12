import { Looker } from "./looker.js";
import FastGlob from "fast-glob";
import { FileInfo } from "./fileinfo.js";
import { findDomination, SourcePattern } from "./sourcepattern.js";
import { targetGet } from "./binds/index.js";

export * from "./looker.js"
export * from "./fileinfo.js"
export * from "./sourcepattern.js"
export * as Styling from "./styling.js"
export * as Sorting from "./sorting.js"
export * as Binding from "./binds/index.js"

//#region default binds
import "./plugins/git.js"
import "./plugins/npm.js"
import "./plugins/vsce.js"
import "./plugins/yarn.js"
//#endregion

export type PatternType = ".*ignore" | "minimatch"
export const filterNameList = ["ignored", "included", "all"] as const
export type FilterName = typeof filterNameList[number]

export interface FileSystemAdapter extends FastGlob.FileSystemAdapter {
	readFileSync: (path: string) => Buffer
}

//#region looking
/**
 * @see {@link ScanMethod}
 */
export interface LookMethodData {
	/**
	 * The {@link Looker} instance with parsed patterns.
	 */
	looker: Looker,
	/**
	 * The path to the target file.
	 */
	filePath: string,
	/**
	 * The information about where the patterns were taken from.
	 */
	sourceFile: SourceFile,
}
/**
 * Also can write rules to the {@link Looker}.
 * @returns `true` if the given source is valid.
 */
export type ScanMethod = (data: LookMethodData) => boolean
export interface SourceFile {
	/**
	 * The source file path.
	 */
	path: string,
	/**
	 * The source file content.
	 */
	content: string,
}
export interface Source {
	/**
	 * Git configuration property.
	 * @see {@link https://git-scm.com/docs/git-config#Documentation/git-config.txt-coreignoreCase|git-config ignorecase}.
	 * @default false
	 */
	ignoreCase?: boolean,
	/**
	 * Additional patterns, which will be used as
	 * other patterns in the `.gitignore` file, or `package.json` "files" property.
	 * @default []
	 */
	addPatterns?: string[],
	/**
	 * First valid source will be used as {@link Looker}.
	 */
	sources: SourceFile[] | SourcePattern,
	/**
	 * Pattern parser name.
	 */
	patternType: PatternType,
	/**
	 * Scanner function. Should return `true` if the given source is valid.
	 */
	method: ScanMethod
}

export interface ScanFileOptions {
	/**
	 * Custom implementation of methods for working with the file system.
	 * @default fs.*
	 */
	fs?: FileSystemAdapter,
	/**
	 * The current working directory in which to search.
	 * @default process.cwd()
	 */
	cwd?: string;
	/**
	 * Specifies the maximum number of concurrent requests from a reader to read
	 * directories.
	 * @default os.cpus().length
	 */
	concurrency?: number;
	/**
	 * Specifies the maximum depth of a read directory relative to the start
	 * directory.
	 * @default Infinity
	 */
	deep?: number,
}

export interface LookFolderOptions extends ScanFileOptions {
	/**
	 * Filter output.
	 * @default "included"
	 */
	filter?: FilterName
}

/**
 * @returns `undefined` if the source is bad.
 */
export async function scanFile(filePath: string, sources: Source[], options: ScanFileOptions): Promise<FileInfo | undefined> {
	for (const source of sources) {
		const looker = new Looker({
			addPatterns: source.addPatterns,
			ignoreCase: source.ignoreCase,
			patternType: source.patternType,
		})

		const sources = source.sources instanceof SourcePattern
			? await source.sources.read(options)
			: source.sources
		for (const file of sources) {
			const l = looker.clone()
			const isGoodSource = source.method({
				sourceFile: file,
				filePath: filePath,
				looker: l
			})
			if (isGoodSource) {
				return FileInfo.from(filePath, l, file)
			}
		}
	}
}

/**
 * Scan project directory paths with results for each file path.
 */
export async function scanPaths(allFilePaths: string[], sources: Source[], options: LookFolderOptions): Promise<FileInfo[] | undefined>
export async function scanPaths(allFilePaths: string[], target: string, options: LookFolderOptions): Promise<FileInfo[] | undefined>
export async function scanPaths(allFilePaths: string[], arg2: Source[] | string, options: LookFolderOptions): Promise<FileInfo[] | undefined> {
	if (typeof arg2 === "string") {
		const bind = targetGet(arg2)
		if (bind === undefined) {
			throw TypeError(`view-ignored can not find target '${arg2}'`)
		}
		return scanPaths(allFilePaths, bind.sources, bind.scanOptions ?? {})
	}

	const { filter = "included" } = options;
	/** Contains parsed sources: file path = parser instance. */
	const cache = new Map<string, Looker>()

	// Find good source.
	for (const source of arg2) {
		let goodFound = false
		const resultList: FileInfo[] = []
		const sourceList: SourceFile[] = source.sources instanceof SourcePattern
			? await source.sources.read(options)
			: source.sources
		for (const filePath of allFilePaths) {
			const possibleSource = findDomination(filePath, sourceList)
			if (!possibleSource) {
				break
			}
			const looker = cache.get(possibleSource.path)
			let info: FileInfo
			if (!looker) {
				const newInfo = await scanFile(filePath, [source], options)
				if (!newInfo) {
					break
				}
				info = newInfo
				cache.set(possibleSource.path, info.looker)
			} else {
				info = FileInfo.from(filePath, looker, possibleSource)
			}
			const shouldPush = info.isIncludedBy(filter)
			if (shouldPush) {
				resultList.push(info)
			}
			goodFound = true
		}
		if (goodFound) {
			return resultList
		}
	}
}
/**
 * Scan project directory with results for each file path.
 */
export function scanProject(sources: Source[], options: LookFolderOptions): Promise<FileInfo[] | undefined>
export function scanProject(target: string, options: LookFolderOptions): Promise<FileInfo[] | undefined>
export async function scanProject(arg: Source[] | string, options: LookFolderOptions): Promise<FileInfo[] | undefined> {
	const paths = await new SourcePattern("**").scan(options);
	if (typeof arg === "string") {
		return await scanPaths(paths, arg, options);
	}
	return await scanPaths(paths, arg, options);
}
//#endregion
