import { Scanner, PatternType, isPatternType } from "./scanner.js";
import FastGlob from "fast-glob";
import { FileInfo } from "./fileinfo.js";
import { findDomination, readdirSync, SourceInfo, statSync } from "./sourceinfo.js";
import { ErrorTargetNotBound, targetGet } from "./binds/index.js";
import { readFile, readFileSync } from "fs";
import path from "path";
import arrify from "arrify";

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
	readFileSync: typeof readFileSync
	readFile: typeof readFile
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
export type ScanMethod = (fileInfo: FileInfo) => boolean

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

	return FastGlob.sync(patterns as string[], patchFastGlobOptions(options)).map(path => SourceInfo.from(path, methodology))
}

export class ErrorNoSources extends Error {
	constructor(public readonly sources: (readonly Methodology[]) | string) {
		super("No available sources for methodology: " + ErrorNoSources.walk(sources))
	}
	static walk(sources: (readonly Methodology[]) | string): string {
		const s = typeof sources === "string" ? targetGet(sources)?.methodology : sources
		if (!s) {
			return `bad bind for target '${s}'`
		}
		return s.map(m => `'${m.pattern}'`).join(" -> ")
	}
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
			const fileInfo = FileInfo.from(filePath, sourceInfo)
			sourceInfo.readSync()
			const isGoodSource = methodology.scan(fileInfo)
			if (isGoodSource) {
				return fileInfo
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
		return scanProject(bind.methodology, bind.scanOptions ?? {})
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
			let fileInfo: FileInfo | undefined
			let sourceInfo: SourceInfo | undefined = cacheFilePaths.get(filePath)
			fileInfo = sourceInfo && FileInfo.from(filePath, sourceInfo)

			if (!fileInfo) {
				sourceInfo = findDomination(filePath, sourceInfoList)
				if (sourceInfo === undefined) {
					break
				}

				fileInfo = FileInfo.from(filePath, sourceInfo)

				const fileDir = path.dirname(filePath)
				const entryList = readdirSync(fileDir)
				for (const entry of entryList) {
					const stat = statSync(entry, fileDir, options.fs)
					if (stat.isFile()) {
						const entryPath = fileDir !== '.' ? fileDir + '/' + entry : entry
						cacheFilePaths.set(entryPath, sourceInfo)
					}
				}
			}

			if (!sourceInfo!.content) {
				sourceInfo!.readSync()
				goodFound = methodology.scan(fileInfo)
				if (!goodFound) {
					break
				}
			}

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
