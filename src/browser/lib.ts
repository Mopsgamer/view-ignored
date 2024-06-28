import * as path from "path";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { Looker } from "./looker.js";
import FastGlob from "fast-glob";

//#region default binds
import "./plugins/git.js"
import "./plugins/npm.js"
import "./plugins/vsce.js"
import "./plugins/yarn.js"
import { targetBindMap } from "./binds.js";
import { FileInfo } from "./fileinfo.js";
import { SourcePattern } from "./sourcepattern.js";
//#endregion

export type PatternType = ".*ignore" | "minimatch"
export const filterNameList = ["ignored", "included", "all"] as const
export type FilterName = typeof filterNameList[number]

export const defaultIgnorePatterns: string[] = [
	"**/.git/**",
	"**/.DS_Store/**"
]

export interface FileSystemAdapter extends FastGlob.FileSystemAdapter {
	readFileSync: (path: string) => Buffer
}

//#region path methods
/**
 * Returns closest dir entry path for another one using the given list.
 * If `undefined`, no reliable sources that contain patterns to ignore.
 */
export function closest<T extends { path: string }>(filePath: string, paths: T[]): T | undefined {
	const filePathDir = path.dirname(filePath)
	const result = paths.reverse().find(p => {
		const pd = path.dirname(p.path)
		const result = filePathDir.startsWith(pd) || pd === '.'
		return result
	})
	return result
}
//#endregion

//#region looking
/**
 * @see {@link LookMethod}
 */
export interface LookMethodData {
	looker: Looker,
	filePath: string,
	sourceFile: SourceFile,
}
/**
 * Returns `true` if given source is valid, writes rules to the looker.
 */
export type LookMethod = (data: LookMethodData) => boolean
export interface SourceFile {
	/**
	 * Source file path
	 */
	path: string,
	/**
	 * Source file content
	 */
	content: string,
}
export interface Source {
	/**
	 * First valid source will be used as {@link Looker}.
	 */
	sources: SourceFile[] | SourcePattern,
	/**
	 * Pattern parser name.
	 */
	patternType: PatternType,
	/**
	 * {@link Looker} maker.
	 */
	method: LookMethod
}

export interface LookFileOptions {
	/**
	 * Custom implementation of methods for working with the file system.
	 *
	 * @default fs.*
	 */
	fs?: FileSystemAdapter,
	/**
	 * The current working directory in which to search.
	 *
	 * @default process.cwd()
	 */
	cwd?: string;
	/**
	 * Specifies the maximum number of concurrent requests from a reader to read
	 * directories.
	 *
	 * @default os.cpus().length
	 */
	concurrency?: number;
	/**
	 * Specifies the maximum depth of a read directory relative to the start
	 * directory.
	 *
	 * @default Infinity
	 */
	deep?: number,
	/**
	 * An array of glob patterns to exclude matches.
	 * This is an alternative way to use negative patterns.
	 *
	 * @default []
	 */
	ignore?: string[],
	/**
	 * Git configuration property.
	 * 
	 * @link [git-config ignorecase](https://git-scm.com/docs/git-config#Documentation/git-config.txt-coreignoreCase).
	 * @default false
	 */
	ignoreCase?: boolean,
	/**
	 * Additional patterns, which will be used as
	 * other patterns in the `.gitignore` file, or `package.json` "files" property.
	 * 
	 * @default []
	 */
	addPatterns?: string[],
	/**
	 * If `true`, paths starting with `./` will be allowed.
	 * 
	 * @default true
	 */
	allowRelativePaths?: boolean
}

export interface LookFolderOptions extends LookFileOptions {
	/**
	 * Filter output.
	 * 
	 * @default "included"
	 */
	filter?: FilterName
}

/**
 * Returns `undefined`, if the source is bad.
 */
export function scanFile(filePath: string, sources: Source[], options: LookFileOptions): FileInfo | undefined {
	const {
		addPatterns = [],
		allowRelativePaths = true,
		ignoreCase = false,
	} = options

	for (const source of sources) {
		const looker = new Looker({
			addPatterns: addPatterns,
			allowRelativePaths: allowRelativePaths,
			ignoreCase: ignoreCase,
			patternType: source.patternType,
		})

		const sources = source.sources instanceof SourcePattern
			? source.sources.read(options)
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
export function scanPaths(allFilePaths: string[], sources: Source[], options: LookFolderOptions): FileInfo[] | undefined
export function scanPaths(allFilePaths: string[], target: string, options: LookFolderOptions): FileInfo[] | undefined
export function scanPaths(allFilePaths: string[], arg2: Source[] | string, options: LookFolderOptions): FileInfo[] | undefined {
	
	if (typeof arg2 === "string") {
		const bind = targetBindMap.get(arg2)
		if (bind === undefined) {
			throw TypeError(`view-ignored can not find target '${arg2}'`)
		}
		return scanPaths(allFilePaths, bind.sources, bind.scanOptions)
	}
	
	// Find good source
	const { filter = "included", ignore = [] } = options;
	ignore.concat(defaultIgnorePatterns)
	const cache = new Map<string, Looker>()
	for (const source of arg2) {
		let goodFound = false
		const resultList: FileInfo[] = []
		for (const filePath of allFilePaths) {
			const s = source.sources instanceof SourcePattern ? source.sources.read(options) : source.sources
			const possibleSource = closest(filePath, s)
			if (possibleSource === undefined) {
				break
			}
			const looker = cache.get(possibleSource.path)
			let info: FileInfo
			if (looker === undefined) {
				const newInfo = scanFile(filePath, [source], options)
				if (newInfo === undefined) {
					break
				}
				info = newInfo
				cache.set(possibleSource.path, info.looker)
			} else {
				info = FileInfo.from(filePath, looker, possibleSource)
			}
			const filterIgnore = (filter === "ignored") && info.ignored
			const filterInclude = (filter === "included") && !info.ignored
			const filterAll = filter === "all"
			const shouldPush = filterIgnore || filterInclude || filterAll
			if (shouldPush) {
				resultList.push(info)
			}
			goodFound ||= true
		}
		if (goodFound) {
			return resultList
		}
	}
	return undefined
}
/**
 * Scan project directory with results for each file path.
 * 
 * @param path Project folder path.
 */
export function scanProject(sources: Source[], options: LookFolderOptions): FileInfo[] | undefined
export function scanProject(target: string, options: LookFolderOptions): FileInfo[] | undefined
export function scanProject(arg: Source[] | string, options: LookFolderOptions): FileInfo[] | undefined {
	const paths = new SourcePattern("**").scan(options)
	if (typeof arg === "string") {
		return scanPaths(paths, arg, options)
	}
	// pov: typescript
	return scanPaths(paths, arg, options)
}
//#endregion
