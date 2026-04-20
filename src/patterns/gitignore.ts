import type { ExtractorFn } from "./extractor.js"
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
export function extractGitignore(source: Source, content: Buffer): void {
	extract(source, content)
	for (const element of source.rules) {
		ruleCompile(element)
	}
}

/**
 * Extracts and compiles patterns from the file.
 *
 * @see {@link ruleCompile}
 *
 * @since 0.8.0
 */
export function extractGitignoreNocase(source: Source, content: Buffer): void {
	extract(source, content)
	for (const element of source.rules) {
		ruleCompile(element, { nocase: true })
	}
}

extractGitignore satisfies ExtractorFn

function extract(source: Source, content: Buffer) {
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

	source.rules.push(include, exclude)
}
