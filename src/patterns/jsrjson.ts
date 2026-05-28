import type { Extractor, ExtractorFn } from "./extractor.js"
import type { Rule } from "./rule.js"

import stripJsonComments from "strip-json-comments"

import { MatchMode } from "./patternMode.js"
import { ruleCompile } from "./resolveSources.js"
import { resolveNegatable } from "./source.js"

interface JsrManifest {
	exclude?: string[]
	include?: string[]
	publish?: {
		exclude?: string[]
		include?: string[]
	}
}

/**
 * @since 0.11.2
 */
export function makeJsrJsonExtractor(path: string, mode: MatchMode = MatchMode.normal): Extractor {
	return {
		extract: (source, content) => {
			const result = extract(source, content)
			if (result instanceof Error) return result
			const rules = source.rules
			for (let i = 0, len = rules.length; i < len; i++) {
				ruleCompile(rules[i]!, mode)
			}
			return undefined
		},
		path,
	}
}

/**
 * @since 0.11.2
 */
export function makeJsrJsoncExtractor(path: string, mode: MatchMode = MatchMode.normal): Extractor {
	const jsr = makeJsrJsonExtractor(path, mode)
	return {
		extract: (source, content) =>
			jsr.extract(source, Buffer.from(stripJsonComments(content.toString()))),
		path,
	}
}

const extract: ExtractorFn = (source, content) => {
	let dist: JsrManifest

	try {
		dist = JSON.parse(content.toString())
	} catch (e) {
		return new Error("Invalid JSON in " + source.path, { cause: e })
	}

	// Basic runtime check to ensure dist is an object
	if (!dist || typeof dist !== "object" || Array.isArray(dist)) {
		return new Error("Invalid " + source.path + ": Root must be an object")
	}

	const include: Rule = { compiled: null, excludes: false, pattern: [] }
	const exclude: Rule = { compiled: null, excludes: true, pattern: [] }

	// Resolve patterns based on the manifest hierarchy
	const target = dist.publish ?? dist

	if (target.exclude && Array.isArray(target.exclude)) {
		exclude.pattern.push(...target.exclude)
	}

	if (target.include && Array.isArray(target.include)) {
		include.pattern.push(...target.include)
	}

	for (const si of [include, exclude]) {
		for (const pattern of si.pattern) {
			resolveNegatable(pattern, true, include, exclude)
		}
	}
	source.rules.push(include, exclude)
	return
}
