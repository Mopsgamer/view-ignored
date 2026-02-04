import type { ExtractorFn } from "./extractor.js"
import type { MatcherContext } from "./matcherContext.js"
import type { Source } from "./source.js"
import { type } from "arktype"
import stripJsonComments from "strip-json-comments"

const jsrManifest = type({
	exclude: "string[]?",
	include: "string[]?",
	publish: {
		exclude: "string[]?",
		include: "string[]?",
	},
})

const parse = jsrManifest.pipe((s: string): typeof jsrManifest.infer => JSON.parse(s))

export function extractJsrJson(source: Source, content: Buffer, ctx: MatcherContext): void {
	const dist = parse(content.toString())
	if (dist instanceof type.errors) {
		source.error = dist
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
}

extractJsrJson satisfies ExtractorFn

export function extractJsrJsonc(source: Source, content: Buffer, ctx: MatcherContext): void {
	extractJsrJson(source, Buffer.from(stripJsonComments(content.toString())), ctx)
}

extractJsrJsonc satisfies ExtractorFn
