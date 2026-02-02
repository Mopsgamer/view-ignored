import { type } from "arktype"
import type { ExtractorFn } from "./extractor.js"
import { sourcePushNegatable, type Source } from "./source.js"

const nodeJsManifest = type({
	files: "string[]?",
})

const parse = type("string")
	.pipe((s) => JSON.parse(s))
	.pipe(nodeJsManifest)

export function extractPackageJson(source: Source, content: Buffer<ArrayBuffer>): void {
	source.inverted = true
	const dist = parse(content.toString())
	if (dist instanceof type.errors) {
		source.error = dist
		return
	}

	if (!dist.files) {
		return
	}

	for (const pattern of dist.files) {
		sourcePushNegatable(source, pattern)
	}
}

extractPackageJson satisfies ExtractorFn
