import path from "path"

export const sortNameList = ["firstFolders", "firstFiles", "type", "mixed", "modified"] as const
export type SortName = typeof sortNameList[number]
export type SortFunc = (a: string, b: string) => number

function slicePath(p: string): [next: string, other: string, isLast: boolean] {
	const slashIndex = p.indexOf('/')
	const next = p.substring(0, slashIndex)
	const other = p.substring(slashIndex + 1)
	const isLast = next === '' && (p.lastIndexOf('/') === slashIndex)
	return [slashIndex < 0 ? other : next, other, isLast]
}

/**
 * Files and folders are sorted by their names.
 * Folders are displayed before files.
 */
export function firstFolders(a: string, b: string): number {
	let comp = 0;
	let next1, others1, next2, others2, last1, last2;
	for (; comp === 0;) {
		[next1, others1, last1] = slicePath(a);
		a = others1;
		[next2, others2, last2] = slicePath(b);
		b = others2;
		comp = mixed(next1, next2);
		if (last1 || last2) {
			if (last1 === last2) {
				break
			}
			if (last1 === false) {
				return -1
			}
			return +1
		}
	}
	return comp
}

/**
 * Files and folders are sorted by their names.
 * Files are displayed before folders.
 */
export function firstFiles(a: string, b: string): number {
	let comp = 0;
	let next1, others1, next2, others2, last1, last2;
	for (; comp === 0;) {
		[next1, others1, last1] = slicePath(a);
		a = others1;
		[next2, others2, last2] = slicePath(b);
		b = others2;
		comp = mixed(next1, next2);
		if (last1 || last2) {
			if (last1 === last2) {
				break
			}
			if (last1 === true) {
				return -1
			}
			return +1
		}
	}
	return comp
}

/**
 * Files and folders are sorted by last modified date in descending order.
 * Folders are displayed before files.
 */
export function modified(a: string, b: string, aDate: Date, bDate: Date): number {
	let comp = 0;
	let others1, others2, last1, last2;
	for (; comp === 0;) {
		[, others1, last1] = slicePath(a);
		a = others1;
		[, others2, last2] = slicePath(b);
		b = others2;
		comp = aDate.getTime() - bDate.getTime()
		if (last1 || last2) {
			if (last1 === last2) {
				break
			}
			if (last1 === false) {
				return -1
			}
			return +1
		}
	}
	return comp
}

/**
 * Files and folders are grouped by extension type then sorted by thir names.
 * Folders are displayed before files.
 */
export function type(a: string, b: string): number {
	let comp = 0;
	let next1, others1, next2, others2, last1, last2;
	for (; comp === 0;) {
		[next1, others1, last1] = slicePath(a);
		a = others1;
		[next2, others2, last2] = slicePath(b);
		b = others2;
		const ppa = path.parse(next1)
		const ppb = path.parse(next2)
		comp = mixed(ppa.ext, ppb.ext) || mixed(ppa.name, ppb.name)
		if (last1 || last2) {
			if (last1 === last2) {
				break
			}
			if (last1 === false) {
				return -1
			}
			return +1
		}
	}
	return comp
}

/**
 * Files and folders are sorted by their names.
 * Files are interwoven with folders.
 */
export function mixed(a: string, b: string): number {
	return a.localeCompare(b, undefined, { ignorePunctuation: false })
}
