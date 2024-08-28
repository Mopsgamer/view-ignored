import * as process from 'node:process';
import * as FS from 'node:fs';
import * as PATH from 'node:path';
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
		const {cwd = process.cwd(), posix = false} = options;
		const readdirSync = FS.readdirSync;
		const path = posix ? PATH.posix : PATH;
		const o = {withFileTypes: true} as const;
		const map = new Map<string, SourceInfo>();
		function processDirectory(directoryPath: string, rootSource?: SourceInfo) {
			const entryList = readdirSync(directoryPath, o);
			const entryListPaths = entryList.map(
				entry => path.relative(cwd, path.join(entry.parentPath, entry.name)),
			);

			if (rootSource === undefined) {
				const goodSourceIndex = entryList.findIndex((entry, entryIndex) => {
					if (!entry.isFile()) {
						return false;
					}

					const isValidOptions: IsValidOptions = {
						...options,
						entry,
						entryPath: entryListPaths[entryIndex],
					};

					const isValid = methodology.findSource(isValidOptions);
					return isValid;
				});

				if (goodSourceIndex > -1) {
					rootSource = new SourceInfo(entryListPaths[goodSourceIndex], methodology, options);
				}
			}

			for (const [entryIndex, entry] of entryList.entries()) {
				const entryPath = entryListPaths[entryIndex];
				if (entry.isSymbolicLink()) {
					continue;
				}

				if (entry.isDirectory()) {
					processDirectory(entryPath, rootSource);
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
		}

		processDirectory(cwd);

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
