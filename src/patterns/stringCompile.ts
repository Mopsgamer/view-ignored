import { makeRe } from "minimatch"

import type { PatternMinimatch, Pattern } from "./pattern.js"

/**
 * Compiles a string of the {@link Pattern}.
 *
 * @see {@link patternCompile}
 */
export function stringCompile(
	pattern: string,
	_: number = -1,
	array: Pattern = [],
): PatternMinimatch {
	const original = pattern
	if (pattern.endsWith("/")) {
		pattern = pattern.substring(0, pattern.length - 1)
	}
	if (pattern.startsWith("/")) {
		pattern = pattern.substring(1)
	} else if (!pattern.startsWith("**/")) {
		pattern = "**/" + pattern
	}

	pattern += "/**"

	const re = makeRe(pattern, {
		dot: true,
		nonegate: true,
		nocomment: true,
		nobrace: true,
	}) as RegExp

	return { re, pattern: original, patternContext: array }
}
