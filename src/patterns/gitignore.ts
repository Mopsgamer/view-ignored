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

		const lineEnd = end > start && content[end - 1] === 0x0d ? end - 1 : end

		if (start < lineEnd) {
			if (content[start] === 35) {
				// skip comment line
			} else {
				let isEscaped = false
				let lineBuff = Buffer.allocUnsafe(lineEnd - start)
				let lineBuffIdx = 0

				for (let i = start; i < lineEnd; i++) {
					const c = content[i] as number
					if (isEscaped) {
						lineBuff[lineBuffIdx++] = c
						isEscaped = false
					} else if (c === 92) {
						isEscaped = true
						lineBuff[lineBuffIdx++] = c
					} else if (c === 35) {
						// unescaped hash
						let isComment = false
						if (i > start && content[i - 1] === 32) {
							// Check if there was any NON-SPACE char before this space
							let hasNonSpaceBefore = false
							for (let j = start; j < i - 1; j++) {
								if (content[j] !== 32 && content[j] !== 9 && content[j] !== 13) {
									hasNonSpaceBefore = true
									break
								}
							}

							if (hasNonSpaceBefore) {
								let backslashCount = 0
								for (let j = i - 2; j >= start; j--) {
									if (content[j] === 92) backslashCount++
									else break
								}
								if (backslashCount % 2 === 0) {
									isComment = true
								}
							}
						}

						if (isComment) {
							if (i > start && lineBuffIdx > 0 && lineBuff[lineBuffIdx - 1] === 32) {
								lineBuffIdx--
							}
							break
						} else {
							lineBuff[lineBuffIdx++] = c
						}
					} else {
						lineBuff[lineBuffIdx++] = c
					}
				}

				if (lineBuffIdx > 0) {
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

					if (actualLastRealCharIdx !== -1) {
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
							resolveNegatable(resolvedLine, false, include, exclude)
						}
					}
				}
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
