import path from 'node:path';
import {type ChalkInstance} from 'chalk';
import {decorFile, type DecorName} from './styling.js';
import {type SourceInfo, type FilterName} from './lib.js';

/**
 * @see {@link FileInfo.prototype.toString}
 */
export type FileInfoToStringOptions = {
	/**
	 * On posix systems, this has no effect.  But, on Windows, it means that
	 * paths will be `/` delimited, and absolute paths will be their full
	 * resolved UNC forms, eg instead of `'C:\\foo\\bar'`, it would return
	 * `'//?/C:/foo/bar'`
	 * @default false
     * @returns `/` delimited paths, even on Windows.
     */
	posix?: boolean;

	/**
	 * The appearance behavior of the file icon.
	 * @default undefined
	 */
	fileIcon?: DecorName;

	/**
	 * Show the scanner's source after the file path.
	 * @default false
	 */
	source?: boolean;

	/**
	 * The appearance behavior of the prefix.
	 * `"+"` for included, `"!"` for excluded.
	 * @default false
	 */
	usePrefix?: boolean;

	/**
	 * The behavior of colors.
	 * @default undefined
	 */
	chalk?: ChalkInstance;

	/**
	 * Determines if the path's base or the entire path should be formatted.
	 * @default true
	 */
	entire?: boolean;
};

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
		public readonly source: SourceInfo,
		/**
		 * Determines if ignored file is ignored or not.
		 */
		public readonly isIgnored: boolean,
	) {}

	/**
	 * @param options Styling options.
	 * @returns Relative file path. Optionally formatted.
	 */
	toString(options?: FileInfoToStringOptions): string {
		const {fileIcon, chalk, usePrefix = false, source: useSource = false, entire = true, posix = false} = options ?? {};
		const pathx = posix ? path.posix : path;
		const parsed = path.parse(this.filePath);
		const fIcon = decorFile(fileIcon, this.filePath);
		let prefix = usePrefix ? (this.isIgnored ? '!' : '+') : '';
		let postfix = useSource ? ' << ' + this.source.toString() : '';

		if (chalk) {
			prefix = chalk.dim(prefix);
			postfix = chalk.dim(postfix);
			const clr = chalk[this.isIgnored ? 'red' : 'green'];
			if (entire) {
				return fIcon + clr(prefix + this.filePath + postfix);
			}

			return parsed.dir + pathx.sep + fIcon + clr(prefix + parsed.base + postfix);
		}

		if (entire) {
			return prefix + this.filePath + postfix;
		}

		return parsed.dir + pathx.sep + fIcon + prefix + parsed.base + postfix;
	}

	/**
	 * @param filter The group name. Default: `"all"`
	 * @returns `true`, if the file is contained by the filter.
	 */
	isIncludedBy(filter?: FilterName | ((fileInfo: FileInfo) => boolean)): boolean {
		if (typeof filter === 'function') {
			return filter(this);
		}

		filter ??= 'all';
		const filterIgnore = (filter === 'ignored') && this.isIgnored;
		const filterInclude = (filter === 'included') && !this.isIgnored;
		const filterAll = filter === 'all';
		const result = filterIgnore || filterInclude || filterAll;
		return result;
	}
}
