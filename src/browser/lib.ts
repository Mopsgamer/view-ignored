import { PatternMatcher, PatternType } from "./matcher.js";
import FastGlob from "fast-glob";
import { FileInfo } from "./fileinfo.js";
import { findDomination, SourcePattern } from "./sourcepattern.js";
import { targetGet } from "./binds/index.js";

export * from "./matcher.js"
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

export const filterNameList = ["ignored", "included", "all"] as const
export type FilterName = typeof filterNameList[number]

export interface FileSystemAdapter extends FastGlob.FileSystemAdapter {
	readFileSync: (path: string) => Buffer
}

//#region looking
/**
 * The data passed to {@link ScanMethod}.
 */
export interface ScanMethodData {
	/**
	 * The {@link PatternMatcher} instance with parsed patterns.
	 */
	matcher: PatternMatcher

	/**
	 * The path to the target file.
	 */
	filePath: string

	/**
	 * The information about where the patterns were taken from.
	 */
	sourceFile: SourceFile
}

/**
 * Also can write rules to the {@link PatternMatcher}.
 * @returns `true` if the given source is valid.
 */
export type ScanMethod = (data: ScanMethodData) => boolean

/**
 * Contains file path and content.
 */
export interface SourceFile {
	/**
	 * The source file path.
	 */
	path: string

	/**
	 * The source file content.
	 */
	content: string
}

/**
 * Represents the methodology for reading the target source.
 */
export interface Source {
	/**
	 * Git configuration property.
	 * @see Official git documentation: {@link https://git-scm.com/docs/git-config#Documentation/git-config.txt-coreignoreCase|ignorecase}.
	 * @default false
	 */
	ignoreCase?: boolean

	/**
	 * Additional patterns, which will be used as
	 * other patterns in the `.gitignore` file, or `package.json` "files" property.
	 * @default []
	 */
	addPatterns?: string[]

	/**
	 * First valid source will be used as {@link PatternMatcher}.
	 */
	sources: SourceFile[] | SourcePattern

	/**
	 * Pattern parser name.
	 */
	patternType: PatternType

	/**
	 * Scanner function. Should return `true` if the given source is valid.
	 */
	method: ScanMethod
}

/**
 * File scanning options.
 * @see {@link ScanFolderOptions}
 */
export interface ScanFileOptions {
	/**
	 * Custom implementation of methods for working with the file system.
	 * @default fs.*
	 */
	fs?: FileSystemAdapter

	/**
	 * The current working directory in which to search.
	 * @default process.cwd()
	 */
	cwd?: string

	/**
	 * Specifies the maximum number of concurrent requests from a reader to read
	 * directories.
	 * @default os.cpus().length
	 */
	concurrency?: number

	/**
	 * Specifies the maximum depth of a read directory relative to the start
	 * directory.
	 * @default Infinity
	 */
	deep?: number
}

/**
 * Folder deep scanning options.
 * @see {@link ScanFileOptions}
 */
export interface ScanFolderOptions extends ScanFileOptions {
	/**
	 * Filter output.
	 * @default "included"
	 */
	filter?: FilterName
}

/**
 * Gets info about the file: it is ignored or not.
 * @returns `undefined` if the source is bad.
 */
export async function scanFile(filePath: string, sources: Source[], options: ScanFileOptions): Promise<FileInfo | undefined> {
	for (const source of sources) {
		const matcher = new PatternMatcher({
			addPatterns: source.addPatterns,
			ignoreCase: source.ignoreCase,
			patternType: source.patternType,
		})

		const sources = source.sources instanceof SourcePattern
			? await source.sources.read(options)
			: source.sources
		for (const file of sources) {
			const l = matcher.clone()
			const isGoodSource = source.method({
				sourceFile: file,
				filePath: filePath,
				matcher: l
			})
			if (isGoodSource) {
				return FileInfo.from(filePath, l, file)
			}
		}
	}
}

/**
 * Scans project directory paths to determine whether they are being ignored.
 */
export async function scanPaths(allFilePaths: string[], sources: Source[], options: ScanFolderOptions): Promise<FileInfo[] | undefined>
export async function scanPaths(allFilePaths: string[], target: string, options: ScanFolderOptions): Promise<FileInfo[] | undefined>
export async function scanPaths(allFilePaths: string[], arg2: Source[] | string, options: ScanFolderOptions): Promise<FileInfo[] | undefined> {
	if (typeof arg2 === "string") {
		const bind = targetGet(arg2)
		if (bind === undefined) {
			throw TypeError(`view-ignored can not find target '${arg2}'`)
		}
		return scanPaths(allFilePaths, bind.sources, bind.scanOptions ?? {})
	}

	const { filter = "included" } = options;
	/** Contains parsed sources: file path = parser instance. */
	const cache = new Map<string, PatternMatcher>()

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
			const matcher = cache.get(possibleSource.path)
			let info: FileInfo
			if (!matcher) {
				const newInfo = await scanFile(filePath, [source], options)
				if (!newInfo) {
					break
				}
				info = newInfo
				cache.set(possibleSource.path, info.matcher)
			} else {
				info = FileInfo.from(filePath, matcher, possibleSource)
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
 * Scans project directory paths to determine whether they are being ignored.
 */
export function scanProject(sources: Source[], options: ScanFolderOptions): Promise<FileInfo[] | undefined>
export function scanProject(target: string, options: ScanFolderOptions): Promise<FileInfo[] | undefined>
export async function scanProject(arg: Source[] | string, options: ScanFolderOptions): Promise<FileInfo[] | undefined> {
	const paths = await new SourcePattern("**").scan(options);
	if (typeof arg === "string") {
		return await scanPaths(paths, arg, options);
	}
	return await scanPaths(paths, arg, options);
}
//#endregion
