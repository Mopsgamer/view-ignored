import type { ExtractorFn } from "./extractor.js"
import type { PatternCompileOptions } from "./patternList.js"
import type { GlobRule } from "./rule.js"

import { isWhitespace } from "../unixify.js"
import { ruleCompile } from "./resolveSources.js"
import { resolveNegatable, type Source } from "./source.js"

/**
 * Populates `source.rules` from ignore content using NPM/ignore-walk whitespace trimming.
 *
 * @since 0.12.0
 */
export function extractNpmignore(
	source: Source,
	content: Uint8Array,
	options?: PatternCompileOptions,
): void | Error {
	try {
		extractNpmignoreRules(source, content, options)
	} catch (e) {
		return e as Error
	}
}

extractNpmignore satisfies ExtractorFn

const decoder = new TextDecoder()

/**
 * Populates `source.rules` from ignore content using NPM/ignore-walk whitespace trimming without catching errors.
 *
 * @since 0.12.0
 */
export function extractNpmignoreRules(
	source: Source,
	content: Uint8Array,
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
		while (lineStart < lineEnd && isWhitespace(content[lineStart]!)) lineStart++

		// Trim trailing spaces
		while (lineEnd > lineStart && isWhitespace(content[lineEnd - 1]!)) lineEnd--

		// '#' is 35
		if (lineStart >= lineEnd || content[lineStart] === 35) {
			start = end + 1
			continue
		}
		const pattern = decoder.decode(content.subarray(lineStart, lineEnd))
		const nextRule = resolveNegatable(pattern, false, rule)
		if (nextRule !== rule) {
			rule = nextRule
			source.rules.push(rule)
		}
		start = end + 1
	}

	if (source.rules.length > 1) source.rules.reverse()

	const rlen = source.rules.length
	for (let i = 0; i < rlen; i++) {
		const r = source.rules[i]!
		if ("list" in r && r.compiled === null) ruleCompile(r, options)
	}
}
