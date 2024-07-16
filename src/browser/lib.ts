import { Scanner, PatternType } from "./scanner.js";
import FastGlob from "fast-glob";
import { FileInfo } from "./fileinfo.js";
import { findDomination, SourceInfo } from "./sourceinfo.js";
import { loadBuiltInPlugin, targetGet } from "./binds/index.js";

export * from "./scanner.js"
export * from "./fileinfo.js"
export * from "./sourceinfo.js"
export * as Styling from "./styling.js"
export * as Sorting from "./sorting.js"
export * as Binding from "./binds/index.js"

//#region default binds
loadBuiltInPlugin("git.js")
loadBuiltInPlugin("npm.js")
loadBuiltInPlugin("vsce.js")
loadBuiltInPlugin("yarn.js")
//#endregion

export const filterNameList = ["ignored", "included", "all"] as const
export type FilterName = typeof filterNameList[number]

export interface FileSystemAdapter extends FastGlob.FileSystemAdapter {
	readFileSync: (path: string) => Buffer
	readFile: (path: string) => Promise<Buffer>
}

function patchFastGlobOptions(options: FastGlob.Options) {
	const patched: FastGlob.Options = {
		...options,
		onlyFiles: true,
		dot: true,
		followSymbolicLinks: false,
	}
	return patched;
}

//#region looking
/**
 * Also can write rules to the {@link Scanner}.
 * @returns `true` if the given source is valid.
 */
export type ScanMethod = (fileInfo: FileInfo) => boolean

/**
 * Represents the methodology for reading the target source.
 */
export interface Methodology {
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
	 * First valid source will be used as {@link Scanner}.
	 */
	pattern: SourceInfo[] | FastGlob.Pattern

	/**
	 * Pattern parser name.
	 */
	patternType: PatternType

	/**
	 * Scanner function. Should return `true` if the given source is valid.
	 */
	scan: ScanMethod
}

export function isSource(source: unknown): source is Methodology {
	return typeof source === "object"
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

export function methodologyToInfoList(methodology: Methodology, options: ScanFileOptions): SourceInfo[] {
	return Array.isArray(methodology.pattern)
		? methodology.pattern
		: FastGlob.sync(methodology.pattern, patchFastGlobOptions(options)).map(path => SourceInfo.from(path))
}

/**
 * Gets info about the file: it is ignored or not.
 * @returns `undefined` if the source is bad.
 */
export async function scanFile(filePath: string, sources: Methodology[], options: ScanFileOptions): Promise<FileInfo | undefined> {
	for (const methodology of sources) {
		const sourceInfoList: SourceInfo[] = methodologyToInfoList(methodology, options)
		const matcher = new Scanner({
			addPatterns: methodology.addPatterns,
			ignoreCase: methodology.ignoreCase,
			patternType: methodology.patternType,
		})

		for (const sourceInfo of sourceInfoList) {
			const l = matcher.clone()
			const fileInfo = FileInfo.from(filePath, l, sourceInfo)
			sourceInfo.readSync()
			const isGoodSource = methodology.scan(fileInfo)
			if (isGoodSource) {
				return FileInfo.from(filePath, l, sourceInfo)
			}
		}
	}
}

/**
 * Scans project directory paths to determine whether they are being ignored.
 */
export async function scanPaths(allFilePaths: string[], sources: Methodology[], options: ScanFolderOptions): Promise<FileInfo[] | undefined>
export async function scanPaths(allFilePaths: string[], target: string, options: ScanFolderOptions): Promise<FileInfo[] | undefined>
export async function scanPaths(allFilePaths: string[], arg2: Methodology[] | string, options: ScanFolderOptions): Promise<FileInfo[] | undefined> {
	if (typeof arg2 === "string") {
		const bind = targetGet(arg2)
		if (bind === undefined) {
			throw TypeError(`view-ignored can not find target '${arg2}'`)
		}
		return scanPaths(allFilePaths, bind.methodology, bind.scanOptions ?? {})
	}

	const { filter = "included" } = options;
	/** Contains parsed sources: file path = parser instance. */
	const cache = new Map<string, Scanner>()

	// Find good source.
	for (const methodology of arg2) {
		let goodFound = false
		const resultList: FileInfo[] = []
		const sourceInfoList: SourceInfo[] = methodologyToInfoList(methodology, options)

		for (const filePath of allFilePaths) {
			const dominated = findDomination(filePath, sourceInfoList.map(sourceInfo => sourceInfo.sourcePath))
			if (dominated === undefined) {
				break
			}
			const source = SourceInfo.from(dominated)
			const matcher = cache.get(source.sourcePath)
			let fileInfo: FileInfo
			if (!matcher) {
				const newInfo = await scanFile(filePath, [methodology], options)
				if (!newInfo) {
					break
				}
				fileInfo = newInfo
				cache.set(source.sourcePath, fileInfo.matcher)
			} else {
				fileInfo = FileInfo.from(filePath, matcher, source)
			}
			const shouldPush = fileInfo.isIncludedBy(filter)
			if (shouldPush) {
				resultList.push(fileInfo)
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
export function scanProject(sources: Methodology[], options: ScanFolderOptions): Promise<FileInfo[] | undefined>
export function scanProject(target: string, options: ScanFolderOptions): Promise<FileInfo[] | undefined>
export async function scanProject(arg: Methodology[] | string, options: ScanFolderOptions): Promise<FileInfo[] | undefined> {
	const paths = await FastGlob.async("**", patchFastGlobOptions(options))
	if (typeof arg === "string") {
		return await scanPaths(paths, arg, options);
	}
	return await scanPaths(paths, arg, options);
}
//#endregion
