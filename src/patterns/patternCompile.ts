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
	const isRoot = pattern.startsWith("/")
	const nocase = !!options?.nocase

	let cleaned = pattern
	if (cleaned.endsWith("/")) cleaned = cleaned.slice(0, -1)
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

	const re = {
		test: (str: string) => test(str, matcherOpts, lowerCleaned, isRoot),
	}

	const cache = { pattern, patternContext: context, re }

	return cache
}

function test(str: string, matcherOpts: glob.Options, cleaned: string, isRoot: boolean): boolean {
	const lowerStr = matcherOpts.nocase ? str.toLowerCase() : str

	if (lowerStr === cleaned || lowerStr.startsWith(cleaned + "/")) {
		return true
	}

	if (matcherOpts.matchBase) {
		const len = cleaned.length
		let pos = str.indexOf(cleaned)
		while (pos !== -1) {
			if (
				(pos === 0 || str[pos - 1] === "/") &&
				(pos + len === str.length || str[pos + len] === "/")
			) {
				return true
			}
			pos = str.indexOf(cleaned, pos + 1)
		}
	}

	const hasGlob = cleaned.includes("*")

	if (hasGlob) {
		if (glob.isMatch(str, cleaned, matcherOpts)) return true

		if (!isRoot) {
			let lastSlash = str.lastIndexOf("/")
			while (lastSlash !== -1) {
				const parent = str.slice(0, lastSlash)
				if (glob.isMatch(parent, cleaned, matcherOpts)) return true
				lastSlash = str.lastIndexOf("/", lastSlash - 1)
			}
		}
	}

	return false
}
