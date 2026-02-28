import { type } from "arktype"
import stripJsonComments from "strip-json-comments"

import type { ExtractorFn } from "./extractor.js"
import type { MatcherContext } from "./matcherContext.js"
import type { SignedPattern } from "./signedPattern.js"

import { signedPatternCompile } from "./resolveSources.js"
import { sourcePushNegatable, type Source } from "./source.js"

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
export function extractJsrJson(source: Source, content: Buffer, ctx: MatcherContext): void {
	extract(source, content, ctx)
	for (const element of source.pattern) {
		signedPatternCompile(element)
	}
}

extractJsrJson satisfies ExtractorFn

/**
 * Extracts and compiles patterns from the file.
 *
 * @see {@link signedPatternCompile}
 *
 * @since 0.6.0
 */
export function extractJsrJsonc(source: Source, content: Buffer, ctx: MatcherContext): void {
	extractJsrJson(source, Buffer.from(stripJsonComments(content.toString())), ctx)
}

extractJsrJsonc satisfies ExtractorFn

function extract(source: Source, content: Buffer, ctx: MatcherContext): void {
	const dist = parse(content.toString())
	const include: SignedPattern = { compiled: null, excludes: false, pattern: [] }
	const exclude: SignedPattern = { compiled: null, excludes: true, pattern: [] }
	if (dist instanceof type.errors) {
		source.error = new Error("Invalid '" + source.path + "': " + dist.summary, { cause: dist })
		ctx.failed.push(source)
		return
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
			sourcePushNegatable(pattern, true, include, exclude)
		}
	}
	source.pattern.push(include, exclude)
}
