import type { ExtractorFn } from "./extractor.js"
import type { GlobRule } from "./rule.js"

import { PatternSpec, type PatternCompileOptions } from "./patternList.js"
import { ruleCompile } from "./resolveSources.js"
import { resolveNegatable, type Source } from "./source.js"

/**
 * Populates `source.rules` from gitignore byte content, respecting Git comment and escape rules.
 *
 * @see {@link ruleCompile}
 *
 * @since 0.6.0
 */
export function extractGitignore(
	source: Source,
	content: Uint8Array,
	options?: PatternCompileOptions,
): void | Error {
	try {
		extractGitignoreRules(source, content, options)
	} catch (e) {
		return e as Error
	}
}

extractGitignore satisfies ExtractorFn

const decoder = new TextDecoder()

function isCommentLineChar(content: Uint8Array, start: number, i: number): boolean {
	if (i <= start || content[i - 1] !== 32) return false
	let hasNonSpaceBefore = false
	for (let j = start; j < i - 1; j++) {
		const c = content[j]!
		if (c !== 32 && c !== 9 && c !== 13) {
			hasNonSpaceBefore = true
			break
		}
	}
	if (!hasNonSpaceBefore) return false

	let backslashCount = 0
	for (let j = i - 2; j >= start && content[j] === 92; j--) {
		backslashCount++
	}
	return backslashCount % 2 === 0
}

function processGitignoreLine(
	_source: Source,
	content: Uint8Array,
	start: number,
	lineEnd: number,
	rule?: GlobRule,
): GlobRule | undefined {
	if (content[start] === 35) return rule

	let hasSpecial = false
	for (let i = start; i < lineEnd; i++) {
		const c = content[i]!
		if (c === 35 || c === 92) {
			hasSpecial = true
			break
		}
	}

	if (!hasSpecial) {
		let endIdx = lineEnd
		while (endIdx > start) {
			const c = content[endIdx - 1]!
			if (c !== 32 && c !== 9 && c !== 13) break
			endIdx--
		}
		if (endIdx <= start) return rule
		const resolvedLine = decoder.decode(content.subarray(start, endIdx))
		if (resolvedLine.length > 0) rule = resolveNegatable(resolvedLine, false, rule)
		return rule
	}

	let isEscaped = false
	const lineBuff = new Uint8Array(lineEnd - start)
	let lineBuffIdx = 0

	for (let i = start; i < lineEnd; i++) {
		const c = content[i]!
		if (isEscaped) {
			lineBuff[lineBuffIdx++] = c
			isEscaped = false
		} else if (c === 92) {
			isEscaped = true
			lineBuff[lineBuffIdx++] = c
		} else if (c === 35) {
			if (isCommentLineChar(content, start, i)) {
				if (lineBuffIdx > 0 && lineBuff[lineBuffIdx - 1] === 32) lineBuffIdx--
				break
			}
			lineBuff[lineBuffIdx++] = c
		} else {
			lineBuff[lineBuffIdx++] = c
		}
	}

	if (lineBuffIdx === 0) return rule

	let actualLastRealCharIdx = -1
	let tempIsEscaped = false
	for (let k = 0; k < lineBuffIdx; k++) {
		const c = lineBuff[k]!
		if (tempIsEscaped) {
			actualLastRealCharIdx = k + 1
			tempIsEscaped = false
		} else if (c === 92) {
			tempIsEscaped = true
		} else if (c !== 32 && c !== 9 && c !== 13) {
			actualLastRealCharIdx = k + 1
		}
	}

	if (tempIsEscaped) actualLastRealCharIdx = lineBuffIdx

	if (actualLastRealCharIdx === -1) return rule

	const rawLine = decoder.decode(lineBuff.subarray(0, actualLastRealCharIdx))

	let resolvedLine = ""
	let resolvedIsEscaped = false
	const startsWithEscapedBang =
		rawLine.length > 1 && rawLine.charCodeAt(0) === 92 && rawLine.charCodeAt(1) === 33
	if (startsWithEscapedBang) {
		resolvedLine = "\\!"
	}
	for (let m = startsWithEscapedBang ? 2 : 0; m < rawLine.length; m++) {
		const rc = rawLine[m]!
		if (resolvedIsEscaped) {
			if (rc === "#" || rc === " " || rc === "\\") {
				resolvedLine += rc
			} else {
				resolvedLine += "\\" + rc
			}
			resolvedIsEscaped = false
		} else if (rc === "\\") {
			resolvedIsEscaped = true
		} else {
			resolvedLine += rc
		}
	}
	if (resolvedIsEscaped) resolvedLine += "\\"

	if (resolvedLine.length > 0) rule = resolveNegatable(resolvedLine, false, rule)

	return rule
}

/**
 * Populates `source.rules` from gitignore byte content without catching errors.
 *
 * @since 0.12.0
 */
export function extractGitignoreRules(
	source: Source,
	content: Uint8Array,
	options?: PatternCompileOptions,
): void {
	const compileOpts: PatternCompileOptions = options
		? options.spec === PatternSpec.gitignore
			? options
			: { list: options.list, nocase: options.nocase, spec: PatternSpec.gitignore }
		: { spec: PatternSpec.gitignore }
	let rule: GlobRule | undefined
	let start = 0
	const len = content.length
	while (start < len) {
		let end = content.indexOf(10, start)
		if (end === -1) end = len

		const lineEnd = end > start && content[end - 1] === 13 ? end - 1 : end

		if (start >= lineEnd) {
			start = end + 1
			continue
		}

		const nextRule = processGitignoreLine(source, content, start, lineEnd, rule)
		if (nextRule && nextRule !== rule) {
			rule = nextRule
			source.rules.push(rule)
		}
		start = end + 1
	}

	if (source.rules.length > 1) source.rules.reverse()

	const rlen = source.rules.length
	for (let i = 0; i < rlen; i++) {
		const r = source.rules[i]!
		if ("list" in r && r.compiled === null) ruleCompile(r, compileOpts)
	}
}
