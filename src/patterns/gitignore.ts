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
 * @since 0.11.2
 */
export function extractGitignoreRules(
	source: Source,
	content: Buffer,
	options?: PatternCompileOptions,
): { exclude: Rule; include: Rule } {
	const include: Rule = { compiled: null, excludes: false, pattern: [] }
	const exclude: Rule = { compiled: null, excludes: true, pattern: [] }

	let start = 0
	while (start < content.length) {
		let end = content.indexOf(0x0a, start)
		if (end === -1) end = content.length

		// Convert only the current line to a string
		let line = content.toString("utf8", start, end).trim()
		start = end + 1

		if (line === "" || line.startsWith("#")) {
			continue
		}

		const cdx = line.indexOf("#")
		if (cdx >= 0) {
			line = line.slice(0, cdx).trim()
			if (line === "") continue
		}

		resolveNegatable(line, false, include, exclude)
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
