import { Scanner, PatternType, isPatternType } from "./scanner.js";
import FastGlob from "fast-glob";
import { FileInfo } from "./fileinfo.js";
import { findDomination, readdirSync, SourceInfo, statSync } from "./sourceinfo.js";
import { targetGet } from "./binds/index.js";
import path from "path";
import arrify from "arrify";
import { ErrorNoSources, ErrorTargetNotBound } from "./errors.js";

export * from "./errors.js"
export * from "./scanner.js"
export * from "./fileinfo.js"
export * from "./sourceinfo.js"
export * as Styling from "./styling.js"
export * as Sorting from "./sorting.js"
export * as Plugins from "./binds/index.js"

/**
 * Contains all filter names.
 */
export const filterNameList = ["ignored", "included", "all"] as const
/**
 * Contains all filter names as a type.
 */
export type FilterName = typeof filterNameList[number]
/**
 * Checks if the value is the {@link FilterName}.
 */
export function isFilterName(value: unknown): value is FilterName {
	return typeof value === "string" && filterNameList.includes(value as FilterName)
}

/**
 * Uses `readFileSync` and `readFile`.
 * @extends FastGlob.FileSystemAdapter
 */
export interface FileSystemAdapter extends FastGlob.FileSystemAdapter {
	readFileSync: (path: string) => Buffer
	readFile: (path: string, cb: (err: NodeJS.ErrnoException | null | undefined, data: Buffer) => void) => void
}

/**
 * Returns new {@link FastGlob.Options} object with forced defaults:
 * `onlyFiles: true`, `dot: true`, `followSymbolicLinks: false`.
 */
export function patchFastGlobOptions<T extends FastGlob.Options>(options: T) {
	const patched: T = {
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
 * @returns `true`, if the given source is valid.
 */
export type ScanMethod = (sourceInfo: SourceInfo) => boolean

/**
 * Represents the methodology for reading the target's source.
 */
export interface Methodology {
	/**
	 * Git configuration property.
	 * @see Official git documentation: {@link https://git-scm.com/docs/git-config#Documentation/git-config.txt-coreignoreCase|ignorecase}.
	 * @default false
	 */
	ignoreCase?: boolean

	/**
	 * Pattern parser name.
	 * @default ".*ignore"
	 */
	matcher: PatternType

	/**
	 * Additional patterns for files, provided by the {@link pattern}.
	 *
	 * Example: You have the '.gitignore' file. You want to scan patterns from it and add additional patterns. Use this property.
	 * @default []
	 */
	matcherAdd?: string[]

	/**
	 * Force ignore patterns.
	 * Takes precedence over {@link matcherAdd}.
	 * @default []
	 */
	matcherExclude?: string[]

	/**
	 * Force include patterns.
	 * Takes precedence over {@link matcherExclude}.
	 * @default []
	 */
	matcherInclude?: string[]

	/**
	 * First valid source will be used as {@link Scanner}.
	 */
	pattern: SourceInfo[] | FastGlob.Pattern[] | SourceInfo | FastGlob.Pattern

	/**
	 * Scanner function. Should return `true`, if the given source is valid and also add patterns to the {@link FileInfo.scanner}.
	 */
	scan: ScanMethod
}

/**
 * Checks if the value is the {@link Methodology}.
 */
export function isMethodology(value: unknown): value is Methodology {
	if (value?.constructor !== Object) {
		return false
	}

	const v = value as Record<string, unknown>

	return isPatternType(v.patternType)
		&& (typeof v.pattern === "string" && FastGlob.isDynamicPattern(v.pattern))
		&& (v.addPatterns === undefined || Array.isArray(v.addPatterns) && v.addPatterns.every(p => Scanner.patternIsValid(p, { patternType: v.patternType as PatternType })))
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
 * Gets sources from the methodology.
 */
export function methodologyToInfoList(methodology: Methodology, options: ScanFileOptions): SourceInfo[] {
	const patterns = arrify(methodology.pattern)
	if (patterns.some(p => typeof p !== "string")) {
		return patterns as SourceInfo[]
	}

	const paths = FastGlob.sync(patterns as string[], options)
	const sourceInfoList = paths.map(p => SourceInfo.from(p, methodology))
	return sourceInfoList
}

/**
 * Gets info about the file: it is ignored or not.
 * @throws {ErrorNoSources} if the source is bad.
 */
export async function scanFile(filePath: string, sources: Methodology[], options: ScanFileOptions): Promise<FileInfo> {
	const optionsPatched = patchFastGlobOptions(options)
	for (const methodology of sources) {
		const sourceInfoList: SourceInfo[] = methodologyToInfoList(methodology, optionsPatched)

		for (const sourceInfo of sourceInfoList) {
			sourceInfo.readSync(options.cwd, options.fs)
			const isGoodSource = methodology.scan(sourceInfo)
			if (isGoodSource) {
				return FileInfo.from(filePath, sourceInfo)
			}
		}
	}
	throw new ErrorNoSources(sources)
}

/**
 * Scans project's directory paths to determine whether they are being ignored.
 * @throws {ErrorNoSources} if the source is bad.
 */
export async function scanProject(sources: Methodology[], options: ScanFolderOptions): Promise<FileInfo[]>
export async function scanProject(target: string, options: ScanFolderOptions): Promise<FileInfo[]>
export async function scanProject(arg1: Methodology[] | string, options: ScanFolderOptions): Promise<FileInfo[]> {
	if (typeof arg1 === "string") {
		const bind = targetGet(arg1)
		if (bind === undefined) {
			throw new ErrorTargetNotBound(arg1)
		}
		return scanProject(bind.methodology, Object.assign(options, bind.scanOptions))
	}

	// Find good source.
	const optionsPatched = patchFastGlobOptions(options)
	const { filter = "included" } = optionsPatched;
	for (const methodology of arg1) {
		let goodFound = false
		const resultList: FileInfo[] = []
		const sourceInfoList: SourceInfo[] = methodologyToInfoList(methodology, optionsPatched)

		/** Map<filePath, sourceInfo>. */
		const cacheFilePaths = new Map<string, SourceInfo>()
		const allFilePaths = FastGlob.sync("**", optionsPatched)
		for (const filePath of allFilePaths) {
			let sourceInfo: SourceInfo | undefined = cacheFilePaths.get(filePath)

			if (!sourceInfo) { // if no cache records -> create
				sourceInfo = findDomination(filePath, sourceInfoList)
				if (sourceInfo === undefined) {
					break
				}

				cacheFilePaths.set(filePath, sourceInfo)

				// also create cache for each file in the direcotry
				const fileDir = path.dirname(filePath)
				const entryList = readdirSync(fileDir, options.cwd, options.fs)
				for (const entry of entryList) {
					const entryPath = fileDir !== '.' ? fileDir + '/' + entry : entry
					const stat = statSync(entryPath, options.cwd, options.fs)
					if (stat.isFile()) {
						cacheFilePaths.set(entryPath, sourceInfo)
					}
				}
			}

			// find good source
			if (!sourceInfo.content) {
				sourceInfo.readSync(options.cwd, options.fs)
				goodFound = methodology.scan(sourceInfo)
				if (!goodFound) {
					break
				}
			}

			// push new FileInfo
			const fileInfo = FileInfo.from(filePath, sourceInfo)
			const shouldPush = fileInfo.isIncludedBy(filter)
			if (shouldPush) {
				resultList.push(fileInfo)
			}
		} // forend

		if (goodFound) {
			return resultList
		}
	} // forend
	throw new ErrorNoSources(arg1)
}
//#endregion
