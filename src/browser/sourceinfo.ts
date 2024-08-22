import {dirname, join} from 'node:path';
import * as process from 'node:process';
import * as FS from 'node:fs';
import {glob} from 'glob';
import arrify from 'arrify';
import {
	type ScanFolderOptions,
	type Methodology,
} from './lib.js';
import {firstFiles} from './sorting.js';

export type SourceInfoHierarcyOptions<T extends {toString(): string}> = {
	/**
	 * @default true
	 */
	closest?: boolean;
	/**
	 * @default undefined
	 */
	filter?: (path: T) => boolean;
};

/**
 * The source of patterns.
 */
export class SourceInfo {
	/**
	 * Gets sources from the methodology.
	 */
	static async from(methodology: Methodology, options: ScanFolderOptions): Promise<SourceInfo[]> {
		const patterns = arrify(methodology.pattern);
		if (patterns.some(p => typeof p !== 'string')) {
			return patterns as SourceInfo[];
		}

		const paths = await glob(patterns as string[], {
			fs: options.fsa,
			cwd: options.cwd,
			nodir: true,
			dot: true,
			posix: true,
		});
		const sourceInfoList = paths.map(p => new SourceInfo(p, methodology, options));
		return sourceInfoList;
	}

	/**
	 * Selects the closest or farthest siblings relative to the path.
	 */
	static hierarcy<T extends {toString(): string}>(filePath: string, pathList: T[], options?: SourceInfoHierarcyOptions<T>): T | undefined {
		const {closest = true, filter} = options ?? {};
		pathList = pathList.sort((a, b) => firstFiles(String(a), String(b)));

		const checkStack: string[] = [];
		{// Fill checkStack
			let directory = filePath.toString();
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
	public content?: Buffer; // eslint-disable-line @typescript-eslint/ban-types

	constructor(
		/**
		 * The relative path to the file.
		 */
		public readonly sourcePath: string,

		/**
		 * The pattern parser.
		 */
		public readonly methodology: Methodology,

		/**
		 * The options.
		 */
		public readonly options: ScanFolderOptions,
	) {}

	/**
	 * @returns File path of the source.
	 */
	toString(): string {
		return this.sourcePath;
	}

	/**
	 * @returns The contents of the source file.
	 */
	// eslint-disable-next-line @typescript-eslint/ban-types
	readSync(): Buffer {
		const cwd = this.options.cwd ?? process.cwd();
		const readFileSync = this.options.fsa?.readFileSync ?? FS.readFileSync;
		this.content = readFileSync(join(cwd, this.sourcePath));
		return this.content;
	}
}
