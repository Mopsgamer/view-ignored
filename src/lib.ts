import path from "path";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { Looker } from "./looker.js";
import type FastGlob from "fast-glob";
import { ChalkInstance } from "chalk";
import { styleConditionFile, StyleName } from "./tools/styles.js";

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
	/**
	 * First valid source will be used as {@link Looker}.
	 */
	fallbacks: FallbackT[],
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
	const { filter = "included" } = options;
	const cache = new Map<string, Looker>()

	// Find good source
	for (const source of sources) {
		let goodFound = false
		const resultList: FileInfo[] = []
		for (const filePath of allFilePaths) {
			const possibleSource = closest(filePath, source.fallbacks)
			if (possibleSource === undefined) {
				break
			}
			const looker = cache.get(possibleSource.path)
			let info: FileInfo
			if (looker === undefined) {
				const newInfo = lookFile(filePath, [source], options)
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
//#endregion

//#region methods
export interface FileInfoToStringOptions {
	styleName?: StyleName
	usePrefix?: boolean
	chalk?: ChalkInstance
}
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
	/**
	 * @param options Styling options.
	 * @param options.styleName Determines if file icon should be used. Default `undefined`.
	 * @param options.usePrefix Default `false`.
	 * @param options.chalk Default `undefined`.
	 * @param formatEntire Determines if path base or entire file path should be formatted. Default `true`.
	 */
	toString(options?: FileInfoToStringOptions, formatEntire = true): string {
		const { styleName, usePrefix = false, chalk } = options ?? {};
		const parsed = path.parse(this.filePath)
		const fileIcon = styleConditionFile(styleName, this.filePath)
		const prefix = usePrefix ? (this.ignored ? '!' : '+') : ''
		if (chalk) {
			const clr = chalk[this.ignored ? "red" : "green"]
			if (formatEntire) {
				return fileIcon + clr(prefix + this.filePath)
			}
			return parsed.dir + '/' + fileIcon + clr(prefix + parsed.base)
		}
		if (formatEntire) {
			return prefix + this.filePath
		}
		return parsed.dir + '/' + fileIcon + prefix + parsed.base
	}
}


//#endregion
