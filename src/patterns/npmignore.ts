import type { ExtractorFn } from "./extractor.js"
import type { PatternCompileOptions } from "./patternCompile.js"
import type { GlobRule } from "./rule.js"

import { resolveNegatable, type Source } from "./source.js"

/**
 * Extracts and compiles patterns from the file with space-trimming behavior.
 * Used for NPM-related targets (like npm, yarn, bun).
 *
 * @since 0.12.0
 */
export function extractNpmignore(
	source: Source,
	content: Buffer,
	options?: PatternCompileOptions,
): void | Error {
	try {
		extractNpmignoreRules(source, content, options)
	} catch (e) {
		return e as Error
	}
}

extractNpmignore satisfies ExtractorFn

function isWhitespace(code: number): boolean {
	return code === 32 || code === 9 || code === 13 || code === 10 || code === 11 || code === 12
}

/**
 * Extracts and compiles patterns from the file using NPM/ignore-walk style trimming.
 *
 * @since 0.12.0
 */
export function extractNpmignoreRules(
	source: Source,
	content: Buffer,
	options?: PatternCompileOptions,
): void {
	let rule: GlobRule | undefined
	let start = 0
	const len = content.length
	while (start < len) {
		let end = content.indexOf(0x0a, start)
		if (end === -1) end = len

		let lineStart = start
		let lineEnd = end > start && content[end - 1] === 0x0d ? end - 1 : end

		// Trim leading spaces
		while (lineStart < lineEnd && isWhitespace(content[lineStart]!)) {
			lineStart++
		}

		// Trim trailing spaces
		while (lineEnd > lineStart && isWhitespace(content[lineEnd - 1]!)) {
			lineEnd--
		}

		if (lineStart < lineEnd && content[lineStart] !== 35) { // '#' is 35
			const pattern = content.toString("utf8", lineStart, lineEnd)
			rule = resolveNegatable(pattern, false, options, rule)
			source.rules.unshift(rule)
		}

		start = end + 1
	}
}
