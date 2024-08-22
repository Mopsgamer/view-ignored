import {dirname, join} from 'node:path';
import * as process from 'node:process';
import * as FS from 'node:fs';
import {glob} from 'glob';
import arrify from 'arrify';
import {
	type ScanFolderOptions,
	type Methodology,
	AbsoluteFile,
} from '../lib.js';
import {mixed} from '../sorting.js';

export type SourceInfoOptions = Pick<ScanFolderOptions, 'cwd' | 'fsa' | 'posix'>;

/**
 * The source of patterns.
 */
export class SourceInfo extends AbsoluteFile {
	/**
	 * Gets sources from the methodology.
	 */
	static async from(methodology: Methodology, options?: SourceInfoOptions): Promise<SourceInfo[]> {
		const {fsa, cwd = process.cwd(), posix = false} = options ?? {};
		const patterns = arrify(methodology.pattern);
		if (patterns.some(p => typeof p !== 'string')) {
			return patterns as SourceInfo[];
		}

		const paths = await glob(patterns as string[], {
			cwd,
			posix,
			fs: fsa,
			nodir: true,
			dot: true,
		});
		const sourceInfoList = paths.map(p => new SourceInfo(p, methodology, options));
		return sourceInfoList;
	}

	constructor(
		/**
		 * The relative path to the file.
		 */
		public readonly path: string,

		/**
		 * The pattern parser.
		 */
		public readonly methodology: Methodology,

		/**
		 * The options.
		 */
		public readonly options?: SourceInfoOptions,
	) {
		super(path);
	}
}
