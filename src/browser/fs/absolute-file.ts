import process from 'node:process';
import * as FS from 'node:fs';
import {dirname, join} from 'node:path';
import {glob} from 'glob';
import {type ScanFolderOptions, type FileSystemAdapter} from '../lib.js';
import {mixed} from '../sorting.js';

export type ClosestOptions<T extends {toString(): string}> = Pick<ScanFolderOptions, 'cwd' | 'fsa' | 'posix'> & {

	/**
	 * @default true
	 */
	closest?: boolean;

	/**
	 * @default undefined
	 */
	filter?: (path: T) => boolean;
};

export class AbsoluteFile {
	constructor(
		/**
		 * Relative path to the file.
		 */
		public readonly path: string,
	) {}

	/**
	 * @returns Relative file path.
	 */
	toString(): string {
		return this.path;
	}
}
