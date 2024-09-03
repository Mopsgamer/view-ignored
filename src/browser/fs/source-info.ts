import * as process from 'node:process';
import * as FSP from 'node:fs/promises';
import * as PATH from 'node:path';
import pLimit from 'p-limit';
import {
	type ScanFolderOptions,
	type Methodology,
	AbsoluteFile,
	type IsValidOptions,
	type RealScanFolderOptions,
} from '../lib.js';

/**
 * The source of patterns.
 */
export class SourceInfo extends AbsoluteFile {
	/**
	 * Get instance for each source file recursively.
	 */
	static async createCache(methodology: Methodology, options: RealScanFolderOptions): Promise<Map<string, SourceInfo>> {
		const map = new Map<string, SourceInfo>();
		async function readDirectoryDeep(cwd: string, rootSource?: SourceInfo): Promise<void> {
			const promises: Array<Promise<void>> = [];
			const entryList = await (options.fsa.promises.readdir ?? FSP.readdir)(cwd, {withFileTypes: true});
			const path = options.posix ? PATH.posix : PATH;
			const entryPathAbsoluteList = entryList.map(entry => path.join(entry.parentPath, entry.name));

			if (rootSource === undefined) {
				const goodSourceIndex = entryList.findIndex((entry, entryIndex) => {
					if (!entry.isFile()) {
						return false;
					}

					const entryPathAbsolute = entryPathAbsoluteList[entryIndex];
					const isValidOptions: IsValidOptions = {
						...options,
						entry,
						entryPath: entryPathAbsolute,
					};

					const isValid = methodology.findSource(isValidOptions);
					return isValid;
				});

				if (goodSourceIndex > -1) {
					const goodSourcePathAbsolute = entryPathAbsoluteList[goodSourceIndex];
					const goodSourcePath = path.relative(cwd, goodSourcePathAbsolute);
					rootSource = new SourceInfo(goodSourcePath, methodology, options);
				}
			}

			for (const [entryIndex, entry] of entryList.entries()) {
				const entryPathAbsolute = entryPathAbsoluteList[entryIndex];
				const entryPath = path.relative(options.cwd, entryPathAbsolute);
				if (entry.isSymbolicLink()) {
					continue;
				}

				if (entry.isDirectory()) {
					promises.push(readDirectoryDeep(entryPathAbsolute, rootSource));
					continue;
				}

				if (!entry.isFile()) {
					continue;
				}

				if (rootSource === undefined) {
					continue;
				}

				map.set(entryPath, rootSource);
			}

			const limit = pLimit(800);
			await Promise.all(promises.map(async p =>
				limit(async () => {
					await p;
				}),
			));
		}

		await readDirectoryDeep(options.cwd);

		return map;
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
		public readonly options?: Required<ScanFolderOptions>,
	) {
		super(path);
	}
}

/**
 * @returns Relative path list.
 */
export async function readDirectoryDeep(options: Pick<RealScanFolderOptions, 'cwd' | 'fsa' | 'posix'>): Promise<string[]> {
	const allFilePaths: string[] = [];
	const promises: Array<Promise<void>> = [];
	const entryList = await (options.fsa.promises.readdir ?? FSP.readdir)(options.cwd, {withFileTypes: true});
	const path = options.posix ? PATH.posix : PATH;

	const reader = async (entryPath: string, entryPathAbsolute: string) => {
		const readDeep = readDirectoryDeep({...options, cwd: entryPathAbsolute});
		const subEntryList = await readDeep;
		const pathList = subEntryList.map(
			subEntry => path.join(entryPath, subEntry),
		);
		allFilePaths.push(...pathList);
	};

	for (const entry of entryList) {
		const entryPathAbsolute = path.join(entry.parentPath, entry.name);
		const entryPath = path.relative(options.cwd, entryPathAbsolute);
		if (entry.isSymbolicLink()) {
			continue;
		}

		if (entry.isDirectory()) {
			promises.push(reader(entryPath, entryPathAbsolute));
			continue;
		}

		if (!entry.isFile()) {
			continue;
		}

		allFilePaths.push(entryPath);
	}

	const limit = pLimit(800);
	await Promise.all(promises.map(async p =>
		limit(async () => {
			await p;
		}),
	));

	return allFilePaths;
}
