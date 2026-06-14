import type { PatternCache, PatternList } from "./patternList.js"

import glob from "micromatch"

/**
 * @since 0.8.0
 */
export type PatternCompileOptions = {
	/**
	 * Disables case sensitivity.
	 *
	 * @default false
	 *
	 * @since 0.8.0
	 */
	nocase?: boolean
}

/**
 * Compiles a string of the {@link PatternList}.
 *
 * @see {@link patternCompile}
 *
 * @since 0.8.0
 */
export function patternCompile(
	pattern: string,
	context: PatternList = [],
	options?: PatternCompileOptions,
): PatternCache {
	const nocase = !!options?.nocase
	const isRoot = pattern.charCodeAt(0) === 47 // '/'

	let cleaned = pattern
	if (cleaned.charCodeAt(cleaned.length - 1) === 47) cleaned = cleaned.slice(0, -1)
	if (isRoot) cleaned = cleaned.slice(1)

	const lowerCleaned = nocase ? cleaned.toLowerCase() : cleaned

	const hasSlash = cleaned.includes("/")

	const matchBase = !isRoot && !hasSlash
	const cleanedWithSlash = lowerCleaned + "/"

	const isMatch = glob.matcher(lowerCleaned, {
		dot: true,
		matchBase,
		nobrace: true,
		nocase,
		nonegate: true,
	})

	const re = {
		test: selectTest(lowerCleaned, cleanedWithSlash, isRoot, nocase, matchBase, isMatch),
	}

	return { pattern, patternContext: context, re }
}

function selectTest(
	cleaned: string,
	cleanedWithSlash: string,
	isRoot: boolean,
	nocase: boolean,
	matchBase: boolean,
	isMatch: (s: string) => boolean,
) {
	let isGlob = false
	const len = cleaned.length
	for (let i = 0; i < len; i++) {
		const c = cleaned.charCodeAt(i)
		if (c === 42 || c === 63 || c === 91 || c === 40 || c === 41 || c === 33) {
			isGlob = true
			break
		}
	}

	if (!isGlob) {
		if (nocase) {
			return (str: string, lowerPath?: string) => {
				const n = lowerPath || str.toLowerCase()
				return (
					n === cleaned ||
					n.startsWith(cleanedWithSlash) ||
					(matchBase && testMatchBase(n, cleaned))
				)
			}
		}
		return (str: string) => {
			return (
				str === cleaned ||
				str.startsWith(cleanedWithSlash) ||
				(matchBase && testMatchBase(str, cleaned))
			)
		}
	}

	return function test(str: string, lowerPath?: string) {
		const n = nocase ? lowerPath || str.toLowerCase() : str

		if (
			n === cleaned ||
			n.startsWith(cleanedWithSlash) ||
			(matchBase && testMatchBase(n, cleaned))
		) {
			return true
		}

		if (isMatch(n)) return true

		if (!isRoot) {
			let lastSlash = n.lastIndexOf("/")
			while (lastSlash !== -1) {
				if (isMatch(n.slice(0, lastSlash))) return true
				lastSlash = n.lastIndexOf("/", lastSlash - 1)
			}
		}

		return false
	}
}

function testMatchBase(str: string, cleaned: string): boolean {
	const len = cleaned.length
	let pos = str.indexOf(cleaned)
	while (pos !== -1) {
		if (
			(pos === 0 || str.charCodeAt(pos - 1) === 47) &&
			(pos + len === str.length || str.charCodeAt(pos + len) === 47)
		) {
			return true
		}
		pos = str.indexOf(cleaned, pos + 1)
	}
	return false
}
