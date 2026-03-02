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
	for (const element of source.pattern) {
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
	for (const element of source.pattern) {
		ruleCompile(element, { nocase: true })
	}
}

extractGitignore satisfies ExtractorFn

function extract(source: Source, content: Buffer) {
	const include: Rule = { compiled: null, excludes: false, pattern: [] }
	const exclude: Rule = { compiled: null, excludes: true, pattern: [] }
	for (let line of content.toString().split("\n")) {
		line = line.trim()
		if (line === "" || line.startsWith("#")) {
			continue
		}
		const cdx = line.indexOf("#")
		if (cdx >= 0) {
			line = line.substring(-cdx)
		}

		resolveNegatable(line, false, include, exclude)
	}
	source.pattern.push(include, exclude)
}
