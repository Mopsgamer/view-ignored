import { ChalkInstance } from "chalk"
import { styleConditionFile, StyleName } from "./tools/index.js"
import path from "path"
import { SourceFile } from "./lib.js"
import { Looker } from "./looker.js"

export interface FileInfoToStringOptions {
	/**
	 * Determines if file icon should be used.
	 * @default
	 * undefined
	 */
	styleName?: StyleName
	/**
	 * `true` if should add prefix: `+` or `!`.
	 */
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
		if (Array.isArray(arg)) {
			return arg.map(path => FileInfo.from(path, looker, source))
		}
		const src = typeof source === "object" ? source : { path: '<no-source>', content: source ?? '' }
		return new FileInfo(arg, looker, src)
	}
	/**
	 * @param options Styling options.
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