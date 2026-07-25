import type { ExtractorFn } from "./extractor.js"
import type { PatternCompileOptions } from "./patternCompile.js"
import type { GlobRule } from "./rule.js"

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

function isCommentLineChar(content: Buffer, start: number, i: number): boolean {
	if (i <= start || content[i - 1] !== 32) {
		return false
	}
	let hasNonSpaceBefore = false
	for (let j = start; j < i - 1; j++) {
		if (content[j] !== 32 && content[j] !== 9 && content[j] !== 13) {
			hasNonSpaceBefore = true
			break
		}
	}

	if (!hasNonSpaceBefore) {
		return false
	}

	let backslashCount = 0
	for (let j = i - 2; j >= start; j--) {
		if (content[j] === 92) {
			backslashCount++
		} else {
			break
		}
	}
	return backslashCount % 2 === 0
}

function processGitignoreLine(
	source: Source,
	content: Buffer,
	start: number,
	lineEnd: number,
	options?: PatternCompileOptions,
	rule?: GlobRule,
): GlobRule | undefined {
	if (content[start] === 35) {
		return rule
	}

	let isEscaped = false
	const lineBuff = Buffer.allocUnsafe(lineEnd - start)
	let lineBuffIdx = 0

	for (let i = start; i < lineEnd; i++) {
		const c = content[i] as number
		if (isEscaped) {
			lineBuff[lineBuffIdx++] = c
			isEscaped = false
			continue
		}
		if (c === 92) {
			isEscaped = true
			lineBuff[lineBuffIdx++] = c
			continue
		}
		if (c === 35) {
			if (isCommentLineChar(content, start, i)) {
				if (i > start && lineBuffIdx > 0 && lineBuff[lineBuffIdx - 1] === 32) {
					lineBuffIdx--
				}
				break
			}
			lineBuff[lineBuffIdx++] = c
			continue
		}
		lineBuff[lineBuffIdx++] = c
	}

	if (lineBuffIdx === 0) {
		return rule
	}

	let actualLastRealCharIdx = -1
	let tempIsEscaped = false
	for (let k = 0; k < lineBuffIdx; k++) {
		const c = lineBuff[k]
		if (tempIsEscaped) {
			actualLastRealCharIdx = k + 1
			tempIsEscaped = false
		} else if (c === 92) {
			tempIsEscaped = true
		} else if (c !== 32 && c !== 9 && c !== 13) {
			actualLastRealCharIdx = k + 1
		}
	}

	if (tempIsEscaped) {
		actualLastRealCharIdx = lineBuffIdx
	}

	if (actualLastRealCharIdx === -1) {
		return rule
	}

	const rawLine = lineBuff.toString("utf8", 0, actualLastRealCharIdx)

	let resolvedLine = ""
	let resolvedIsEscaped = false
	for (let m = 0; m < rawLine.length; m++) {
		const rc = rawLine[m]
		if (resolvedIsEscaped) {
			resolvedLine += rc
			resolvedIsEscaped = false
		} else if (rc === "\\") {
			resolvedIsEscaped = true
		} else {
			resolvedLine += rc
		}
	}
	if (resolvedIsEscaped) {
		resolvedLine += "\\"
	}

	if (resolvedLine.length > 0) {
		rule = resolveNegatable(resolvedLine, false, options, rule)
		source.rules.unshift(rule)
	}

	return rule
}

/**
 * Extracts and compiles patterns from the file.
 *
 * @since 0.12.0
 */
export function extractGitignoreRules(
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

		const lineEnd = end > start && content[end - 1] === 0x0d ? end - 1 : end

		if (start < lineEnd) {
			rule = processGitignoreLine(source, content, start, lineEnd, options, rule)
		}

		start = end + 1
	}
}
