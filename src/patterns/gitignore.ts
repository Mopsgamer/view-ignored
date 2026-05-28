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
export function extractGitignore(source: Source, content: Buffer): void | Error {
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
export function extractGitignoreNocase(source: Source, content: Buffer): void | Error {
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
	const len = content.length
	while (start < len) {
		let end = content.indexOf(10, start)
		if (end === -1) end = len

		let s = start
		while (s < end && content[s]! <= 32) s++
		let e = end
		while (e > s && content[e - 1]! <= 32) e--

		if (s < e && content[s] !== 35) {
			let line = content.toString("utf8", s, e)
			const c = line.indexOf("#")
			if (c !== -1) {
				line = line.slice(0, c).trim()
			}
			if (line !== "") resolveNegatable(line, false, include, exclude)
		}

		start = end + 1
	}

	source.rules.push(include, exclude)
}
