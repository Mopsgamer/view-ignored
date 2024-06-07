import path from "path";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { patternsExclude, getLookMethodGit, getLookMethodPropJSON } from "./tools/methods.js";
import { Looker } from "./looker.js";
import { minimatch } from "minimatch";
import type FastGlob from "fast-glob";

export type PatternType = ".*ignore" | "minimatch"
export const targetNameList = ['git', 'npm', 'yarn', 'vsce'] as const
export type TargetName = typeof targetNameList[number]
export const filterNameList = ["ignored", "included", "all"] as const
export type FilterName = typeof filterNameList[number]

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
export interface Source<FallbackT = SourceFile> {
	fallbacks: FallbackT[],
	patternType: PatternType,
	method: LookMethod
}

export interface LookFileOptions {
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
	 */
	addPattern?: string[],
	/**
	 * If `true`, paths starting with `./` will be allowed.
	 * 
	 * @default true
	 */
	allowRelativePaths?: boolean
}

export interface LookFolderOptions extends LookFileOptions {
	/**
	 * Force exclude patterns from file path list.
	 * 
	 * @see {@link patternsExclude} can be used.
	 */
	hidePattern?: string[],
	/**
	* Specifies the maximum depth of a read directory relative to the start
	* directory.
	*
	* @default Infinity
	*/
	deep?: FastGlob.Options["deep"]
	/**
	 * Mark the directory path with the final slash.
	 *
	 * @default false
	 */
	markDirectories?: FastGlob.Options["markDirectories"]
	filter?: FilterName
}

/**
 * Returns `undefined`, if the source is bad.
 */
export function lookFile(filePath: string, sources: Source[], options: LookFileOptions): FileInfo | undefined {
	const {
		addPattern = [],
		allowRelativePaths = true,
		ignoreCase = false,
	} = options

	for (const source of sources) {
		const looker = new Looker({
			allowRelativePaths: allowRelativePaths,
			ignoreCase: ignoreCase,
			patternType: source.patternType,
		})

		for (const file of source.fallbacks) {
			const isGoodSource = source.method({
				sourceFile: file,
				filePath: filePath,
				looker: looker
			})
			if (isGoodSource) {
				looker.add(addPattern)
				return FileInfo.from(filePath, looker, file)
			}
		}
	}
}

/**
 * Scan project directory with results for each file path.
 */
export function lookProject(allFilePaths: string[], sources: Source[], options: LookFolderOptions): FileInfo[] | undefined {
	const { hidePattern = [], filter = "included", deep, markDirectories } = options;
	const cache = new Map<SourceFile, FileInfo>()
	const resultList: FileInfo[] = []
	const paths = allFilePaths.filter(
		p => !hidePattern.some(
			pat => minimatch(pat, p)
		)
	)
	// Find good source
	let goodFound = false
	for (const source of sources) {
		for (const filePath of paths) {
			const possibleSource = closest(filePath, source.fallbacks)
			if (possibleSource === undefined) {
				break
			}
			let info = cache.get(possibleSource)
			if (info === undefined) {
				info = lookFile(filePath, [source], options)
				if (info === undefined) {
					break
				}
				cache.set(possibleSource, info)
			}
			const filterIgnore = (filter === "ignored") && info.ignored
			const filterInclude = (filter === "included") && !info.ignored
			const filterAll = filter === "all"
			if (filterIgnore || filterInclude || filterAll) {
				resultList.push(info)
			}
			goodFound = true
		}
		if (goodFound) {
			break
		}
	}
	if (!goodFound) {
		return
	}
	return resultList
}
//#endregion

//#region methods
/**
 * Result of the file path scan.
 */
export class FileInfo {
	public readonly ignored: boolean
	constructor(
		public readonly filePath: string,
		public readonly looker: Looker,
		public readonly source: SourceFile,
	) {
		this.ignored = looker.ignores(filePath)
	}
	static from(paths: string[], looker: Looker, source?: SourceFile | string): FileInfo[]
	static from(path: string, looker: Looker, source?: SourceFile | string): FileInfo
	static from(arg: string | string[], looker: Looker, source?: SourceFile | string): FileInfo | FileInfo[] {
		if (typeof arg === "string") {
			const src = typeof source === "object" ? source : { path: '<no-source>', content: source ?? '' }
			return new FileInfo(arg, looker, src)
		}
		return arg.map(path => FileInfo.from(path, looker, source))
	}
	toString(): string {
		return `${this.filePath}`
	}
}


//#endregion
