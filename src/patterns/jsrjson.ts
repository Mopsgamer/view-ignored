import { type } from "arktype"
import stripJsonComments from "strip-json-comments"

import type { ExtractorFn } from "./extractor.js"
import type { MatcherContext } from "./matcherContext.js"
import { signedPatternCompile } from "./resolveSources.js"
import type { Source } from "./source.js"

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
 */
export function extractJsrJson(source: Source, content: Buffer, ctx: MatcherContext): void {
	const dist = parse(content.toString())
	if (dist instanceof type.errors) {
		source.error = new Error("Invalid '" + source.path + "': " + dist.summary, { cause: dist })
		ctx.failed.push(source)
		return
	}

	if (!dist.publish) {
		if (dist.exclude) {
			source.pattern.exclude.push(...dist.exclude)
		}
	} else if (dist.publish.exclude) {
		source.pattern.exclude.push(...dist.publish.exclude)
	}

	if (!dist.publish) {
		if (dist.include) {
			source.pattern.include.push(...dist.include)
		}
	} else if (dist.publish.include) {
		source.pattern.include.push(...dist.publish.include)
	}
	signedPatternCompile(source.pattern)
}

extractJsrJson satisfies ExtractorFn

/**
 * Extracts and compiles patterns from the file.
 *
 * @see {@link signedPatternCompile}
 */
export function extractJsrJsonc(source: Source, content: Buffer, ctx: MatcherContext): void {
	extractJsrJson(source, Buffer.from(stripJsonComments(content.toString())), ctx)
}

extractJsrJsonc satisfies ExtractorFn
