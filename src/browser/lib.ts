import { Scanner, PatternType, isPatternType } from "./scanner.js";
import { glob, FSOption } from "glob";
import { FileInfo } from "./fileinfo.js";
import { SourceInfo } from "./sourceinfo.js";
import { targetGet } from "./binds/index.js";
import path from "path";
import { ErrorNoSources, ErrorTargetNotBound } from "./errors.js";
import * as FS from "fs"

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
 * @extends glob.FileSystemAdapter
 */
export interface FileSystemAdapter extends FSOption {
	readFileSync?: typeof FS.readFileSync
	readdirSync?: typeof FS.readdirSync
	statSync?: typeof FS.statSync
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
	 * @see {@link https://git-scm.com/docs/git-config#Documentation/git-config.txt-coreignoreCase|git-config ignorecase}.
	 * @default false
	 */
	ignoreCase?: boolean

	/**
	 * The parser for the patterns.
	 * @default "gitignore"
	 */
	matcher: PatternType

	/**
	 * Use the patterns for including instead of excluding/ignoring.
	 * @default false
	 */
	matcherNegated?: boolean

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
	pattern: SourceInfo[] | string[] | SourceInfo | string

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

	const v = value as Partial<Methodology>

	return isPatternType(v.matcher)
		&& (typeof v.pattern === "string")
		&& (v.matcherAdd === undefined || Array.isArray(v.matcherAdd) && v.matcherAdd.every(p => Scanner.patternIsValid(p, { patternType: v.matcher as PatternType })))
}

/**
 * File scanning options.
 * @see {@link ScanFolderOptions}
 */
export interface ScanFileOptions {
	/**
	 * Custom implementation of methods for working with the file system.
	 * @default import * as FS from "fs"
	 */
	fsa?: FileSystemAdapter

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
	maxDepth?: number
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
	filter?: FilterName | ((fileInfo: FileInfo) => boolean)
}

/**
 * Gets info about the file: it is ignored or not.
 * @throws {ErrorNoSources} if the source is bad.
 */
export async function scanFile(filePath: string, sources: Methodology[], options: ScanFileOptions): Promise<FileInfo> {
	const { fsa = FS, cwd = process.cwd() } = options ?? {}
	for (const methodology of sources) {
		const sourceInfoList: SourceInfo[] = await SourceInfo.fromMethodology(methodology, options)

		for (const sourceInfo of sourceInfoList) {
			sourceInfo.readSync(cwd, fsa.readFileSync ?? FS.readFileSync)
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

	const allFilePaths = await glob("**", {
		...options,
		nodir: true,
		dot: true,
		posix: true,
	})

	// Find good source.
	const { filter = "included", fsa = FS, cwd = process.cwd() } = options;
	for (const methodology of arg1) {
		const resultList: FileInfo[] = []
		const sourceInfoList: SourceInfo[] = await SourceInfo.fromMethodology(methodology, options)

		if (sourceInfoList.length < 1) {
			continue
		}

		const cache = new Set<string>()

		let noSource = false
		for (const filePath of allFilePaths) {
			if (cache.has(filePath)) {
				continue
			}

			const sourceInfo = SourceInfo.hierarcy(filePath, sourceInfoList, {
				closest: false,
				filter(sourceInfo) {
					if (!(sourceInfo instanceof SourceInfo)) {
						return true
					}
					if (sourceInfo.content === undefined) {
						sourceInfo.readSync(cwd, fsa.readFileSync ?? FS.readFileSync)
					}
					return methodology.scan(sourceInfo)
				}
			})

			if (sourceInfo === undefined) {
				noSource = true
				break
			}

			// also create cache for each file in the direcotry
			const fileDir = path.dirname(filePath)
			const fileDirAbsolute = path.join(cwd, fileDir)
			const entryList = (fsa?.readdirSync ?? FS.readdirSync)(fileDirAbsolute)

			for (const entry of entryList) {
				const entryPath = path.join(fileDir, entry)
				const entryPathNormal = fileDir !== '.' ? fileDir + '/' + entry : entry
				const entryPathAbsolute = path.join(cwd, entryPath)
				const stat = (fsa?.statSync ?? FS.statSync)(entryPathAbsolute)
				cache.add(entryPathNormal)

				if (stat.isFile()) {
					// push new FileInfo
					const fileInfo = FileInfo.from(entryPathNormal, sourceInfo)
					if (fileInfo.isIncludedBy(filter)) {
						resultList.push(fileInfo)
					}
				}
			}
		} // forend

		if (noSource) {
			continue
		}

		return resultList
	} // forend
	throw new ErrorNoSources(arg1)
}
//#endregion
