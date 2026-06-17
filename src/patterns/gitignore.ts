import type { ExtractorFn } from "./extractor.js"
import type { PatternCompileOptions } from "./patternCompile.js"
import type { Rule } from "./rule.js"

import { ruleCompile } from "./resolveSources.js"
import { resolveNegatable, type Source } from "./source.js"

/**
 * Extracts and compiles patterns from the file.
 *
 * @see {@link ruleCompile}
 *
 * @since 0.6.0
 */
export function extractGitignore(
	source: Source,
	content: Buffer,
	options?: PatternCompileOptions,
): void | Error {
	try {
		extractGitignoreRules(source, content, options)
	} catch (e) {
		return e as Error
	}
}

extractGitignore satisfies ExtractorFn

/**
 * Extracts and compiles patterns from the file.
 *
 * @since 0.12.0
 */
export function extractGitignoreRules(
	source: Source,
	content: Buffer,
	options?: PatternCompileOptions,
): { exclude: Rule; include: Rule } {
	const include: Rule = { compiled: null, excludes: false, pattern: [] }
	const exclude: Rule = { compiled: null, excludes: true, pattern: [] }

	let start = 0
	const len = content.length
	while (start < len) {
		let end = content.indexOf(0x0a, start)
		if (end === -1) end = len

		let lineStart = start
		let lineEnd = end

		// Skip leading whitespace
		while (lineStart < lineEnd) {
			const c = content[lineStart]
			if (c !== 32 && c !== 9 && c !== 13) break
			lineStart++
		}

		// Skip trailing whitespace
		while (lineEnd > lineStart) {
			const c = content[lineEnd - 1]
			if (c !== 32 && c !== 9 && c !== 13) break
			lineEnd--
		}

		if (lineStart < lineEnd && content[lineStart] !== 35) {
			// Not empty and not a comment
			let line = content.toString("utf8", lineStart, lineEnd)
			const cdx = line.indexOf("#")
			if (cdx >= 0) {
				line = line.slice(0, cdx)
				// Re-trim if it was trimmed before
				let lineEnd2 = line.length
				while (lineEnd2 > 0) {
					const c = line.charCodeAt(lineEnd2 - 1)
					if (c !== 32 && c !== 9 && c !== 13) break
					lineEnd2--
				}
				line = line.slice(0, lineEnd2)
			}
			if (line !== "") {
				resolveNegatable(line, false, include, exclude)
			}
		}

		start = end + 1
	}

	if (include.pattern.length > 0) {
		ruleCompile(include, options)
		source.rules.push(include)
	}
	if (exclude.pattern.length > 0) {
		ruleCompile(exclude, options)
		source.rules.push(exclude)
	}
	return { exclude, include }
}
