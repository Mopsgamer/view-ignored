import { ChalkInstance } from "chalk"
import { styleConditionFile, StyleName } from "./styling.js"
import path from "path"
import { FilterName, SourceFile } from "./lib.js"
import { PatternMatcher } from "./matcher.js"

export interface FileInfoToStringOptions {
	/**
	 * The appearance behavior of the file icon.
	 * @default undefined
	 */
	styleName?: StyleName

	/**
	 * The appearance behavior of the prefix.
	 * `"+"` for included, `"!"` for excluded.
	 * @default false
	 */
	usePrefix?: boolean

	/**
	 * The behavior of colors.
	 * @default undefined
	 */
	chalk?: ChalkInstance
}

/**
 * The result of the file path scan.
 */
export class FileInfo {
	constructor(
		/**
		 * Relative path to the file.
		*/
		public readonly filePath: string,

		/**
		 * Parser instance. Can be used to determine if the file is ignored.
		 * @see {@link ignored} can be used instead of it.
		 */
		public readonly matcher: PatternMatcher,

		/**
		 * Source of patterns, used by {@link matcher}.
		*/
		public readonly source: SourceFile,
	) { }

	/**
	 * Determines if ignored file is ignored or not.
	 */
	get ignored(): boolean {
		return this.matcher.ignores(this.filePath)
	}

	static from(paths: string[], matcher: PatternMatcher, source?: SourceFile | string): FileInfo[]
	static from(path: string, matcher: PatternMatcher, source?: SourceFile | string): FileInfo
	static from(arg: string | string[], matcher: PatternMatcher, source?: SourceFile | string): FileInfo | FileInfo[] {
		if (Array.isArray(arg)) {
			return arg.map(path => FileInfo.from(path, matcher, source))
		}
		const src = typeof source === "object" ? source : { path: '<no-source>', content: source ?? '' }
		return new FileInfo(arg, matcher, src)
	}

	/**
	 * @param options Styling options. Default `{}`.
	 * @param formatEntire Determines if the path's base or the entire path should be formatted. Default `true`.
	 * @returns Relative file path. Optionally formatted.
	 */
	toString(options: FileInfoToStringOptions = {}, formatEntire = true): string {
		const { styleName, usePrefix = false, chalk } = options;
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

	/**
	 * @param filter The group name.
	 * @returns `true` if the file is contained by the filter.
	 */
	isIncludedBy(filter: FilterName): boolean {
		const filterIgnore = (filter === "ignored") && this.ignored
		const filterInclude = (filter === "included") && !this.ignored
		const filterAll = filter === "all"
		const result = filterIgnore || filterInclude || filterAll
		return result
	}
}