import path from 'node:path';
import {type ChalkInstance} from 'chalk';
import {decorFile, type DecorName} from './styling.js';
import {type FilterName, type Scanner, type SourceInfo} from './lib.js';

/**
 * @see {@link FileInfo.prototype.toString}
 */
export type FileInfoToStringOptions = {
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
	/**
	 * The pattern parser.
	 */
	public readonly scanner: Scanner;

	constructor(
		/**
		 * Relative path to the file.
		*/
		public readonly filePath: string,

		/**
		 * Source of patterns, used by {@link scanner}.
		 */
		public readonly source: SourceInfo,
	) {
		this.scanner = this.source.scanner;
	}

	/**
	 * Determines if ignored file is ignored or not.
	 */
	isIgnored(): boolean {
		return this.scanner.matches(this.filePath);
	}

	/**
	 * Creates new {@link FileInfo} from each file path.
	 */
	static from(filePathList: string[], sourceInfo: SourceInfo): FileInfo[];
	/**
	 * Creates new {@link FileInfo} from the file path.
	 */
	static from(filePath: string, sourceInfo: SourceInfo): FileInfo;
	static from(argument: string | string[], sourceInfo: SourceInfo): FileInfo | FileInfo[] {
		if (Array.isArray(argument)) {
			return argument.map(path => FileInfo.from(path, sourceInfo));
		}

		return new FileInfo(argument, sourceInfo);
	}

	/**
	 * @param options Styling options.
	 * @returns Relative file path. Optionally formatted.
	 */
	toString(options?: FileInfoToStringOptions): string {
		const {fileIcon, chalk, usePrefix = false, source: useSource = false, entire = true} = options ?? {};
		const parsed = path.parse(this.filePath);
		const fIcon = decorFile(fileIcon, this.filePath);
		const ignored = this.isIgnored();
		let prefix = usePrefix ? (ignored ? '!' : '+') : '';
		let postfix = useSource ? ' << ' + this.source.toString() : '';

		if (chalk) {
			prefix = chalk.dim(prefix);
			postfix = chalk.dim(postfix);
			const clr = chalk[ignored ? 'red' : 'green'];
			if (entire) {
				return fIcon + clr(prefix + this.filePath + postfix);
			}

			return parsed.dir + '/' + fIcon + clr(prefix + parsed.base + postfix);
		}

		if (entire) {
			return prefix + this.filePath + postfix;
		}

		return parsed.dir + '/' + fIcon + prefix + parsed.base + postfix;
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
		const filterIgnore = (filter === 'ignored') && this.isIgnored();
		const filterInclude = (filter === 'included') && !this.isIgnored();
		const filterAll = filter === 'all';
		const result = filterIgnore || filterInclude || filterAll;
		return result;
	}
}
