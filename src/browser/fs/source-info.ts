import type * as FS from 'node:fs';
import * as FSP from 'node:fs/promises';
import * as PATH from 'node:path';
import pLimit from 'p-limit';
import {
	type ScanFolderOptions,
	type Methodology,
	File,
	type RealScanFolderOptions,
	type ReadSource,
} from '../lib.js';

export type DirentParent = Dirent & {children: Tree};
export type Tree = Array<Dirent | DirentParent>;

export type Dirent = {
	entry: FS.Dirent;
	absolutePath: string;
	relativePath: string;
};

export function direntFrom(entry: FS.Dirent, path: typeof PATH, cwd: string): Dirent {
	const absolutePath = path.join(entry.parentPath, entry.name);
	const relativePath = path.relative(cwd, absolutePath);
	return {
		entry,
		absolutePath,
		relativePath,
	};
}

/**
 * The source of patterns.
 */
export class SourceInfo extends File {
	/**
	 * Get instance for each source file recursively.
	 */
	static async createCache(methodology: Methodology, optionsReal: RealScanFolderOptions): Promise<Map<string, ReadSource>> {
		const map = new Map<string, ReadSource>();

		const direntTree = await readDirectoryDeep('.', optionsReal);

		function processDirentTree(direntTree: Tree, rootSource?: ReadSource) {
			if (rootSource === undefined) {
				const goodSource = direntTree.find(dirent => {
					const {entry} = dirent;
					if (!entry.isFile()) {
						return false;
					}

					const isValid = methodology.findSource(optionsReal, dirent);
					return isValid;
				});

				if (goodSource !== undefined) {
					rootSource = {
						...goodSource,
						sourceInfo: new SourceInfo(goodSource.relativePath, methodology, optionsReal),
					};
				}
			}

			for (const dirent of direntTree) {
				if ('children' in dirent) {
					processDirentTree(dirent.children, rootSource);
				}

				if (rootSource !== undefined) {
					map.set(dirent.relativePath, rootSource);
				}
			}
		}

		processDirentTree(direntTree);

		return map;
	}

	constructor(
		/**
		 * The relative path to the file.
		 */
		public readonly relativePath: string,

		/**
		 * The pattern parser.
		 */
		public readonly methodology: Methodology,

		/**
		 * The options.
		 */
		public readonly options?: Required<ScanFolderOptions>,
	) {
		super(relativePath);
	}
}

/**
 * @returns Path list.
 */
export async function readDirectoryDeep(directoryPath: string, optionsReal: Pick<RealScanFolderOptions, 'cwd' | 'fsa' | 'posix' | 'concurrency'>): Promise<Tree> {
	const entryPaths: Tree = [];
	const promises: Array<Promise<void>> = [];
	const path = optionsReal.posix ? PATH.posix : PATH;
	const entryList = await (optionsReal.fsa.promises.readdir ?? FSP.readdir)(path.join(optionsReal.cwd, directoryPath), {withFileTypes: true});

	const reader = async (entry: Dirent) => {
		const children = await readDirectoryDeep(entry.relativePath, optionsReal);
		entryPaths.push({...entry, children});
	};

	for (const nativeEntry of entryList) {
		const dirent = direntFrom(nativeEntry, path, optionsReal.cwd);
		const {entry} = dirent;
		if (entry.isSymbolicLink()) {
			continue;
		}

		if (entry.isDirectory()) {
			promises.push(reader(dirent));
			continue;
		}

		if (!entry.isFile()) {
			continue;
		}

		entryPaths.push(dirent);
	}

	const limit = pLimit(optionsReal.concurrency);
	await Promise.all(promises.map(p => limit(() => p)));

	return entryPaths;
}
