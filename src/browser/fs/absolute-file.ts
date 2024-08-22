import process from 'node:process';
import * as FS from 'node:fs';
import {dirname, join} from 'node:path';
import {type FileSystemAdapter} from '../lib.js';
import {mixed} from '../sorting.js';

export type HierarchyOptions<T extends {toString(): string}> = {
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
	/**
	 * Selects the closest or farthest siblings relative to the given directory.
	 * @param directoryPath Unix path to the directory.
	 * @param pathList The list of sub-/parrent directories.
	 */
	static closest<T extends {toString(): string}>(directoryPath: {toString(): string}, pathList: T[], options?: HierarchyOptions<T>): T | undefined {
		const {closest = true, filter} = options ?? {};
		pathList = pathList.sort((a, b) => mixed(String(a), String(b)));

		const checkStack: string[] = [String(directoryPath)];
		{// Fill checkStack
			let directory = String(directoryPath);
			for (; ;) {
				const parent = dirname(directory);
				if (directory === parent) {
					break;
				}

				checkStack.push(directory = parent);
			}
		}

		if (!closest) {
			checkStack.reverse();
		}

		const cache = new Map<T, string>();
		for (const directory of checkStack) {
			const closestPath = pathList.find(path => {
				let pathDirectory = cache.get(path);
				if (!pathDirectory) {
					cache.set(path, pathDirectory = dirname(path.toString()));
				}

				if (directory !== pathDirectory) {
					return false;
				}

				const result = filter ? filter(path) : true;
				return result;
			});

			if (closestPath) {
				return closestPath;
			}
		}
	}

	/**
	 * The last source file content.
	 */
	public content?: Uint8Array;

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

	/**
	 * @returns The contents of the source file.
	 */
	readSync(fsa: FileSystemAdapter, cwd = process.cwd()): Uint8Array {
		const readFileSync = fsa?.readFileSync ?? FS.readFileSync;
		this.content = readFileSync(join(cwd, this.path));
		return this.content;
	}
}
