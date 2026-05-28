import type { Extractor, ExtractorFn } from "./extractor.js"
import type { Rule } from "./rule.js"

import { MatchMode } from "./patternMode.js"
import { ruleCompile } from "./resolveSources.js"
import { resolveNegatable } from "./source.js"

/**
 * @since 0.11.2
 */
export function makeGitignoreExtractor(
	path: string,
	mode: MatchMode = MatchMode.normal,
): Extractor {
	return {
		extract: (source, content) => {
			const result = extract(source, content)
			const rules = source.rules
			for (let i = 0, len = rules.length; i < len; i++) {
				ruleCompile(rules[i]!, mode)
			}
			return result
		},
		path,
	}
}

const extract: ExtractorFn = (source, content) => {
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
	return
}
