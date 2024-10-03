import path from 'node:path';
import {stat} from 'node:fs/promises';
import pLimit from 'p-limit';
import {Directory, type RealScanFolderOptions, type File} from '../lib.js';
import {configDefault} from '../config.js';

/**
 * Contains all file sort names.
 */
export const sortNameList = ['firstFolders', 'firstFiles', 'type', 'mixed', 'modified'] as const;
/**
 * Contains all file sort names as a type.
 */
export type SortName = typeof sortNameList[number];
/**
 * {@link Array.prototype.sort}'s file path comparator.
 */
export type SortFunction = (a: string, b: string) => number;
/**
 * Checks if the value is the {@link SortName}.
 */
export function isSortName(value: unknown): value is SortName {
	return typeof value === 'string' && sortNameList.includes(value as SortName);
}

/**
 * @example
 * "path/to/the/file" -> ["path", "to/the/file", false]
 * "file" -> ["file", "file", true]
 * "file/" -> ["file", "", false]
 */
export function shiftPath(p: string): [next: string, other: string, isLast: boolean] {
	const slashIndex = p.search(/[/\\]/);
	const next = p.slice(0, Math.max(0, slashIndex));
	const other = p.slice(Math.max(0, slashIndex + 1));
	const isLast = next === '';
	return [slashIndex < 0 ? other : next, other, isLast];
}

/**
 * Files and folders are sorted by their names.
 * Folders are displayed before files.
 */
export function firstFolders(a: string, b: string): number {
	let comp = 0;
	for (; comp === 0;) {
		const [next1, post1, last1] = shiftPath(a);
		a = post1;
		const [next2, post2, last2] = shiftPath(b);
		b = post2;
		comp = mixed(next1, next2);
		if (last1 || last2) {
			if (last1 === last2) {
				break;
			}

			if (!last1) {
				return -1;
			}

			return +1;
		}
	}

	return comp;
}

/**
 * Files and folders are sorted by their names.
 * Files are displayed before folders.
 */
export function firstFiles(a: string, b: string): number {
	let comp = 0;
	for (; comp === 0;) {
		const [next1, post1, last1] = shiftPath(a);
		a = post1;
		const [next2, post2, last2] = shiftPath(b);
		b = post2;
		comp = mixed(next1, next2);
		if (last1 || last2) {
			if (last1 === last2) {
				break;
			}

			if (last1) {
				return -1;
			}

			return +1;
		}
	}

	return comp;
}

/**
 * Files and folders are sorted by last modified date in descending order.
 * Folders are displayed before files.
 * @see {@link makeMtimeCache}
 */
export function modified(a: string, b: string, map: Map<{toString(): string}, number>): number {
	let comp = 0;
	for (; comp === 0;) {
		const [, post1, last1] = shiftPath(a);
		a = post1;
		const [, post2, last2] = shiftPath(b);
		b = post2;
		comp = (map.get(a) ?? 0) - (map.get(b) ?? 0);
		if (last1 || last2) {
			if (last1 === last2) {
				break;
			}

			if (!last1) {
				return -1;
			}

			return +1;
		}
	}

	return comp;
}

/**
 * Files and folders are grouped by extension type then sorted by thir names.
 * Folders are displayed before files.
 */
export function type(a: string, b: string): number {
	let comp = 0;
	for (; comp === 0;) {
		const [next1, post1, last1] = shiftPath(a);
		a = post1;
		const [next2, post2, last2] = shiftPath(b);
		b = post2;
		const ppa = path.parse(next1);
		const ppb = path.parse(next2);
		comp = mixed(ppa.ext, ppb.ext) || mixed(ppa.name, ppb.name);
		if (last1 || last2) {
			if (last1 === last2) {
				break;
			}

			if (!last1) {
				return -1;
			}

			return +1;
		}
	}

	return comp;
}

/**
 * Files and folders are sorted by their names.
 * Files are interwoven with folders.
 */
export function mixed(a: string, b: string): number {
	return a.localeCompare(b, undefined, {ignorePunctuation: false});
}

/**
 * @see Makes the cache for {@link modified}.
 */
export async function makeMtimeCache(out: Map<File, number>, directory: Directory, options?: Pick<RealScanFolderOptions, 'concurrency'>): Promise<Map<File, number>> {
	const {concurrency = configDefault.concurrency} = options ?? {};
	const limit = pLimit(concurrency);
	await Promise.all(directory.children.map(entry => {
		if (entry instanceof Directory) {
			return makeMtimeCache(out, entry, options);
		}

		return limit(async () => {
			const fileStat = await stat(entry.absolutePath);
			out.set(entry, fileStat.mtime.getTime());
		});
	}));

	return out;
}
