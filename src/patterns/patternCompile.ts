import { makeRe } from "minimatch"

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
	const original = pattern
	if (pattern.endsWith("/")) {
		pattern = pattern.substring(0, pattern.length - 1)
	}
	if (pattern.startsWith("/")) {
		pattern = pattern.substring(1)
	} else if (!pattern.startsWith("**/")) {
		pattern = "**/" + pattern
	}

	if (!pattern.endsWith("/**")) {
		pattern += "/**"
	}

	const re = makeRe(pattern, {
		dot: true,
		nonegate: true,
		nocomment: true,
		nobrace: true,
		nocase: options?.nocase ?? false,
	}) as RegExp

	return { re, pattern: original, patternContext: context }
}
