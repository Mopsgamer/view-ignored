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

		// Skip trailing whitespace, unless it's escaped
		while (lineEnd > lineStart) {
			const c = content[lineEnd - 1]
			if (c !== 32 && c !== 9 && c !== 13) break
			if (lineEnd > lineStart + 1 && content[lineEnd - 2] === 92) break
			lineEnd--
		}

		if (lineStart < len && content[lineStart] === 35) {
			// skip comment line
		} else if (lineStart < lineEnd) {
			// Not empty and not a comment
			let isEscaped = false
			let lineBuff = Buffer.allocUnsafe(lineEnd - lineStart)
			let lineBuffIdx = 0
			let lastRealCharIdx = -1

			for (let i = lineStart; i < lineEnd; i++) {
				const c = content[i] as number
				if (isEscaped) {
					lineBuff[lineBuffIdx++] = c
					isEscaped = false
					lastRealCharIdx = lineBuffIdx
				} else if (c === 92) {
					isEscaped = true
				} else if (c === 35) {
					// unescaped hash starts a comment
					break
				} else {
					lineBuff[lineBuffIdx++] = c
					if (c !== 32 && c !== 9 && c !== 13) {
						lastRealCharIdx = lineBuffIdx
					}
				}
			}

			if (lastRealCharIdx !== -1) {
				const line = lineBuff.toString("utf8", 0, lastRealCharIdx)
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
