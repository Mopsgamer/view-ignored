import {dirname, join} from 'node:path';
import * as process from 'node:process';
import {glob} from 'glob';
import arrify from 'arrify';
import {
	type FileSystemAdapter, type Methodology, type ScanFileOptions, Scanner,
} from './lib.js';

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
	 * Creates new {@link SourceInfo} instance.
	 */
	static from(path: string, methodology: Methodology): SourceInfo {
		const scanner = new Scanner({
			negated: methodology.matcherNegated,
			ignoreCase: methodology.ignoreCase,
			patternType: methodology.matcher,
		});
		scanner.add(methodology.matcherAdd);
		scanner.addExclude(methodology.matcherExclude);
		scanner.addInclude(methodology.matcherInclude);
		return new SourceInfo(path, scanner);
	}

	/**
	 * Gets sources from the methodology.
	 */
	static async fromMethodology(methodology: Methodology, options: ScanFileOptions): Promise<SourceInfo[]> {
		const patterns = arrify(methodology.pattern);
		if (patterns.some(p => typeof p !== 'string')) {
			return patterns as SourceInfo[];
		}

		const paths = await glob(patterns as string[], {
			...options,
			nodir: true,
			dot: true,
			posix: true,
		});
		const sourceInfoList = paths.map(p => SourceInfo.from(p, methodology));
		return sourceInfoList;
	}

	/**
	 * Selects the closest or farthest siblings relative to the path.
	 */
	static hierarcy<T extends {toString(): string}>(filePath: string, pathList: T[], options?: SourceInfoHierarcyOptions<T>): T | undefined {
		const {closest = true, filter: scan} = options ?? {};
		pathList = pathList.sort((a, b) => a.toString().localeCompare(b.toString()));

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

				return scan ? scan?.(path) : true;
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
		public readonly scanner: Scanner,
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
	readSync(cwd: string | undefined, readFileSync: Exclude<FileSystemAdapter['readFileSync'], undefined>): Buffer {
		cwd ??= process.cwd();
		this.content = readFileSync(join(cwd, this.sourcePath));
		return this.content;
	}
}
