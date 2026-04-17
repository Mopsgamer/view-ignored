import { type } from "arktype"
import stripJsonComments from "strip-json-comments"

import type { ExtractorFn } from "./extractor.js"
import type { Rule } from "./rule.js"

import { ruleCompile } from "./resolveSources.js"
import { resolveNegatable, type Source } from "./source.js"

const jsrManifest = type({
	exclude: "string[]?",
	include: "string[]?",
	"publish?": {
		exclude: "string[]?",
		include: "string[]?",
	},
})

const parse = type("string")
	.pipe((s) => JSON.parse(s))
	.pipe(jsrManifest)

/**
 * Extracts and compiles patterns from the file.
 *
 * @since 0.6.0
 */
export function extractJsrJson(source: Source, content: Buffer): void {
	extract(source, content)
	for (const element of source.rules) {
		ruleCompile(element)
	}
}

extractJsrJson satisfies ExtractorFn

/**
 * Extracts and compiles patterns from the file.
 *
 * @see {@link ruleCompile}
 *
 * @since 0.6.0
 */
export function extractJsrJsonc(source: Source, content: Buffer): void {
	extractJsrJson(source, Buffer.from(stripJsonComments(content.toString())))
}

extractJsrJsonc satisfies ExtractorFn

function extract(source: Source, content: Buffer): void {
	const dist = parse(content.toString())
	const include: Rule = { compiled: null, excludes: false, pattern: [] }
	const exclude: Rule = { compiled: null, excludes: true, pattern: [] }
	if (dist instanceof type.errors) {
		throw new Error("Invalid '" + source.path + "': " + dist.summary, { cause: dist })
	}

	if (!dist.publish) {
		if (dist.exclude) {
			exclude.pattern.push(...dist.exclude)
		}
	} else if (dist.publish.exclude) {
		exclude.pattern.push(...dist.publish.exclude)
	}

	if (!dist.publish) {
		if (dist.include) {
			include.pattern.push(...dist.include)
		}
	} else if (dist.publish.include) {
		include.pattern.push(...dist.publish.include)
	}

	for (const si of [include, exclude]) {
		for (const pattern of si.pattern) {
			resolveNegatable(pattern, true, include, exclude)
		}
	}
	source.rules.push(include, exclude)
}
