import {parse, type ParsedPath} from 'node:path';
import {type Directory} from './directory.js';

export class File implements ParsedPath {
	public readonly base: string;
	public readonly dir: string;
	public readonly ext: string;
	public readonly name: string;
	public readonly root: string;
	constructor(
		/**
         * The parent of the file.
         */
		public readonly parent: Directory,

		/**
		 * The relative path to the file.
		 */
		public readonly relativePath: string,

		/**
		 * The absolute path to the file.
		 */
		public readonly absolutePath: string,
	) {
		const parsed = parse(absolutePath);
		this.base = parsed.base;
		this.dir = parsed.dir;
		this.ext = parsed.ext;
		this.name = parsed.name;
		this.root = parsed.root;
	}

	/**
	 * @returns The relative path to the file.
	 */
	toString(): string {
		return this.relativePath;
	}
}
