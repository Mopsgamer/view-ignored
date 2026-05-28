import glob from "micromatch"

import type { PatternCache, PatternList } from "./patternList.js"

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
	const isRoot = pattern.charCodeAt(0) === 47 // '/'
	const nocase = !!options?.nocase

	let cleaned = pattern
	if (cleaned.charCodeAt(cleaned.length - 1) === 47) cleaned = cleaned.slice(0, -1)
	if (isRoot) cleaned = cleaned.slice(1)

	const lowerCleaned = nocase ? cleaned.toLowerCase() : cleaned
	const matchBase = !isRoot && !cleaned.includes("/")

	const matcherOpts: glob.Options = {
		dot: true,
		matchBase,
		nobrace: true,
		nocase,
		nonegate: true,
	}

	const isMatch = glob.matcher(lowerCleaned, { ...matcherOpts, nocase: false })

	const re = {
		test: (str: string, lower?: string) =>
			test(str, lower, isMatch, lowerCleaned, isRoot, nocase, matchBase),
	}

	const cache = { pattern, patternContext: context, re }

	return cache
}

function test(
	str: string,
	lower: string | undefined,
	isMatch: (str: string) => boolean,
	cleaned: string,
	isRoot: boolean,
	nocase: boolean,
	matchBase: boolean,
): boolean {
	const normStr = nocase ? lower || str.toLowerCase() : str

	if (normStr === cleaned || normStr.startsWith(cleaned + "/")) {
		return true
	}

	if (matchBase) {
		const len = cleaned.length
		let pos = normStr.indexOf(cleaned)
		while (pos !== -1) {
			if (
				(pos === 0 || normStr.charCodeAt(pos - 1) === 47) &&
				(pos + len === normStr.length || normStr.charCodeAt(pos + len) === 47)
			) {
				return true
			}
			pos = normStr.indexOf(cleaned, pos + 1)
		}
	}

	if (isMatch(normStr)) return true
	if (!isRoot) {
		let lastSlash = normStr.lastIndexOf("/")
		while (lastSlash !== -1) {
			if (isMatch(normStr.slice(0, lastSlash))) return true
			lastSlash = normStr.lastIndexOf("/", lastSlash - 1)
		}
	}

	return false
}
