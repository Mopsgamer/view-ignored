import * as FSP from 'node:fs/promises';
import pLimit from 'p-limit';
import {
	Directory,
	type ScanFolderOptions,
	type Methodology,
	File,
	type RealScanFolderOptions,
} from '../lib.js';

/**
 * The source of patterns.
 */
export class SourceInfo extends File {
	/**
	 * Get instance for each source file recursively.
	 */
	static async createCache(methodology: Methodology, optionsReal: RealScanFolderOptions): Promise<Map<string, SourceInfo>> {
		const map = new Map<string, SourceInfo>();

		const direntTree = await readDirectoryDeep('.', optionsReal);

		function processDirentTree(direntTree: Directory, rootSource?: SourceInfo) {
			if (rootSource === undefined) {
				const goodSource = direntTree.children.find(child => {
					if (!(child instanceof File)) {
						return false;
					}

					const isValid = methodology.findSource(optionsReal, child);
					return isValid;
				});

				if (goodSource !== undefined) {
					rootSource = new SourceInfo(goodSource.relativePath, goodSource.absolutePath, methodology, optionsReal);
				}
			}

			for (const dirent of direntTree.children) {
				if ('children' in dirent) {
					processDirentTree(dirent, rootSource);
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
		relativePath: string,

		/**
		 * The absolute path to the file.
		 */
		absolutePath: string,

		/**
		 * The pattern parser.
		 */
		public readonly methodology: Methodology,

		/**
		 * The options.
		 */
		public readonly options?: Required<ScanFolderOptions>,
	) {
		super(relativePath, absolutePath);
	}
}

/**
 * @returns Path list.
 */
export async function readDirectoryDeep(directoryPath: string, optionsReal: Pick<RealScanFolderOptions, 'cwd' | 'fsa' | 'patha' | 'concurrency'>): Promise<Directory> {
	const {fsa, patha, cwd, concurrency} = optionsReal;
	const limit = pLimit(concurrency);
	const readdir = fsa.promises.readdir ?? FSP.readdir;
	const absolutePath = patha.join(cwd, directoryPath);
	const relativePath = patha.relative(cwd, absolutePath);
	const entryList = await readdir(absolutePath, {withFileTypes: true});

	const promises = entryList.map(entry => (limit(async () => {
		const absolutePath = patha.join(entry.parentPath, entry.name);
		const relativePath = patha.relative(cwd, absolutePath);

		if (entry.isDirectory() && !entry.isSymbolicLink()) {
			const children = await readDirectoryDeep(relativePath, optionsReal);
			return children;
		}

		return (new File(relativePath, absolutePath));
	})));

	const entryPaths = await Promise.all(promises);
	return new Directory(relativePath, absolutePath, entryPaths);
}
