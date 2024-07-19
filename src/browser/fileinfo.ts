import { ChalkInstance } from "chalk"
import { styleConditionFile, StyleName } from "./styling.js"
import path from "path"
import { FilterName, SourceInfo } from "./lib.js"
import { Scanner } from "./scanner.js"

/**
 * @see {@link FileInfo.prototype.toString}
 */
export interface FileInfoToStringOptions {
	/**
	 * The appearance behavior of the file icon.
	 * @default undefined
	 */
	styleName?: StyleName

	/**
	 * Show the matcher's source after the file path.
	 * @default false
	 */
	useSource?: boolean

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
		public readonly matcher: Scanner,

		/**
		 * Source of patterns, used by {@link matcher}.
		 */
		public readonly source: SourceInfo
	) { }

	/**
	 * Determines if ignored file is ignored or not.
	 */
	get ignored(): boolean {
		return this.matcher.ignores(this.filePath)
	}

	/**
	 * Creates new {@link FileInfo} from each file path.
	 */
	static from(filePathList: string[], matcher: Scanner, sourceInfo: SourceInfo): FileInfo[]
	/**
	 * Creates new {@link FileInfo} from the file path.
	 */
	static from(filePath: string, matcher: Scanner, sourceInfo: SourceInfo): FileInfo
	static from(arg: string | string[], matcher: Scanner, sourceInfo: SourceInfo): FileInfo | FileInfo[] {
		if (Array.isArray(arg)) {
			return arg.map(path => FileInfo.from(path, matcher, sourceInfo))
		}
		return new FileInfo(arg, matcher, sourceInfo)
	}

	/**
	 * @param options Styling options. Default `{}`.
	 * @param formatEntire Determines if the path's base or the entire path should be formatted. Default `true`.
	 * @returns Relative file path. Optionally formatted.
	 */
	toString(options: FileInfoToStringOptions = {}, formatEntire = true): string {
		const { styleName, chalk, usePrefix = false, useSource = false } = options
		const parsed = path.parse(this.filePath)
		const fIcon = styleConditionFile(styleName, this.filePath)
		const prefix = usePrefix ? (this.ignored ? '!' : '+') : ''
		const postfix = useSource ? chalk.dim(" << " + this.source.toString()) : ''

		if (chalk) {
			const clr = chalk[this.ignored ? "red" : "green"]
			if (formatEntire) {
				return fIcon + clr(prefix + this.filePath + postfix)
			}
			return parsed.dir + '/' + fIcon + clr(prefix + parsed.base + postfix)
		}
		if (formatEntire) {
			return prefix + this.filePath + postfix
		}
		return parsed.dir + '/' + fIcon + prefix + parsed.base + postfix
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
