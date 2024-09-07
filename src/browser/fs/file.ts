import {type ScanFolderOptions} from '../lib.js';

export class File {
	constructor(
		/**
		 * The relative path to the file.
		 */
		public readonly relativePath: string,
	) {}

	/**
	 * @returns The relative file path.
	 */
	toString(): string {
		return this.relativePath;
	}
}
