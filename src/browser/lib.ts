import { Scanner, PatternType, isPatternType } from "./scanner.js";
import FastGlob from "fast-glob";
import { FileInfo } from "./fileinfo.js";
import { findDomination, readdirOfFileSync, SourceInfo, statSync } from "./sourceinfo.js";
import { targetGet } from "./binds/index.js";
import { readFile, readFileSync } from "fs";
import path from "path";

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
	 * Scanner function. Should return `true`, if the given source is valid.
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
		&& (v.addPatterns === undefined || Array.isArray(v.addPatterns) && v.addPatterns.every(p => Scanner.isValidPattern(p, { patternType: v.patternType as PatternType })))
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
	return Array.isArray(methodology.pattern)
		? methodology.pattern
		: FastGlob.sync(methodology.pattern, patchFastGlobOptions(options)).map(path => SourceInfo.from(
			path, new Scanner({
				addPatterns: methodology.addPatterns,
				ignoreCase: methodology.ignoreCase,
				patternType: methodology.patternType,
				cwd: options.cwd
			})
		))
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
export async function scanPaths(allFilePaths: string[], sources: Methodology[], options: ScanFolderOptions): Promise<FileInfo[]>
export async function scanPaths(allFilePaths: string[], target: string, options: ScanFolderOptions): Promise<FileInfo[]>
export async function scanPaths(allFilePaths: string[], arg2: Methodology[] | string, options: ScanFolderOptions): Promise<FileInfo[]> {
	if (typeof arg2 === "string") {
		const bind = targetGet(arg2)
		if (bind === undefined) {
			throw new ErrorNoSources(arg2)
		}
		return scanPaths(allFilePaths, bind.methodology, bind.scanOptions ?? {})
	}

	// Find good source.
	const optionsPatched = patchFastGlobOptions(options)
	const { filter = "included" } = optionsPatched;
	for (const methodology of arg2) {
		let goodFound = false
		const resultList: FileInfo[] = []
		const sourceInfoList: SourceInfo[] = methodologyToInfoList(methodology, optionsPatched)

		/** Map<filePath, fileInfo>. */
		const cache = new Map<string, SourceInfo>()
		for (const filePath of allFilePaths) {
			let fileInfo: FileInfo | undefined
			{
				let sourceInfo: SourceInfo | undefined = cache.get(filePath)
				fileInfo = sourceInfo && FileInfo.from(filePath, sourceInfo)
				if (!fileInfo) {
					sourceInfo = findDomination(filePath, sourceInfoList)
					if (sourceInfo === undefined) {
						throw new ErrorNoSources(arg2)
					}

					const entryList = readdirOfFileSync(filePath)
					for (const entry of entryList) {
						const stat = statSync(entry, path.dirname(filePath), options.fs)
						if (stat.isFile()) {
							cache.set(entry, sourceInfo)
						}
					}

					sourceInfo.readSync()
					fileInfo = FileInfo.from(filePath, sourceInfo)
				}
			}

			goodFound = methodology.scan(fileInfo)
			if (!goodFound) {
				break
			}
			const shouldPush = fileInfo.isIncludedBy(filter)
			if (shouldPush) {
				resultList.push(fileInfo)
			}
		}
		if (goodFound) {
			return resultList
		}
	}
	throw new ErrorNoSources(arg2)
}

/**
 * Scans project's directory paths to determine whether they are being ignored.
 * @throws {ErrorNoSources} if the source is bad.
 */
export function scanProject(sources: Methodology[], options: ScanFolderOptions): Promise<FileInfo[]>
export function scanProject(target: string, options: ScanFolderOptions): Promise<FileInfo[]>
export async function scanProject(arg: Methodology[] | string, options: ScanFolderOptions): Promise<FileInfo[]> {
	const optionsPatched = patchFastGlobOptions(options)
	const paths = await FastGlob.async("**", optionsPatched)
	if (typeof arg === "string") {
		return await scanPaths(paths, arg, optionsPatched);
	}
	return await scanPaths(paths, arg, optionsPatched);
}
//#endregion
