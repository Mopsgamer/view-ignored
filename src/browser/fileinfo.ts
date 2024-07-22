import { ChalkInstance } from "chalk"
import { decorFile, DecorName } from "./styling.js"
import path from "path"
import { FilterName, Scanner, SourceInfo } from "./lib.js"

/**
 * @see {@link FileInfo.prototype.toString}
 */
export interface FileInfoToStringOptions {
	/**
	 * The appearance behavior of the file icon.
	 * @default undefined
	 */
	fileIcon?: DecorName

	/**
	 * Show the scanner's source after the file path.
	 * @default false
	 */
	source?: boolean

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

	/**
	 * Determines if the path's base or the entire path should be formatted.
	 * @default true
	 */
	entire?: boolean
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
		 * Source of patterns, used by {@link scanner}.
		 */
		public readonly source: SourceInfo
	) { }

	get scanner(): Scanner {
		return this.source.scanner
	}

	/**
	 * Determines if ignored file is ignored or not.
	 */
	get ignored(): boolean {
		return this.scanner.ignores(this.filePath)
	}

	/**
	 * Creates new {@link FileInfo} from each file path.
	 */
	static from(filePathList: string[], sourceInfo: SourceInfo): FileInfo[]
	/**
	 * Creates new {@link FileInfo} from the file path.
	 */
	static from(filePath: string, sourceInfo: SourceInfo): FileInfo
	static from(arg: string | string[], sourceInfo: SourceInfo): FileInfo | FileInfo[] {
		if (Array.isArray(arg)) {
			return arg.map(path => FileInfo.from(path, sourceInfo))
		}
		return new FileInfo(arg, sourceInfo)
	}

	/**
	 * @param options Styling options.
	 * @returns Relative file path. Optionally formatted.
	 */
	toString(options?: FileInfoToStringOptions): string {
		const { fileIcon, chalk, usePrefix = false, source: useSource = false, entire = true } = options ?? {}
		const parsed = path.parse(this.filePath)
		const fIcon = decorFile(fileIcon, this.filePath)
		let prefix = usePrefix ? (this.ignored ? '!' : '+') : ''
		let postfix = useSource ? " << " + this.source.toString() : ''

		if (chalk) {
			prefix = chalk.dim(prefix)
			postfix = chalk.dim(postfix)
			const clr = chalk[this.ignored ? "red" : "green"]
			if (entire) {
				return fIcon + clr(prefix + this.filePath + postfix)
			}
			return parsed.dir + '/' + fIcon + clr(prefix + parsed.base + postfix)
		}
		if (entire) {
			return prefix + this.filePath + postfix
		}
		return parsed.dir + '/' + fIcon + prefix + parsed.base + postfix
	}

	/**
	 * @param filter The group name.
	 * @returns `true`, if the file is contained by the filter.
	 */
	isIncludedBy(filter: FilterName): boolean {
		const filterIgnore = (filter === "ignored") && this.ignored
		const filterInclude = (filter === "included") && !this.ignored
		const filterAll = filter === "all"
		const result = filterIgnore || filterInclude || filterAll
		return result
	}
}
