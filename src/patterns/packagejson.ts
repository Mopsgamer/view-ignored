import { type } from "arktype"
import {
	sourcePushNegatable,
	type Source,
	type SourceExtractor,
	type Extraction,
} from "./matcher.js"

const nodeJsManifest = type({
	files: "string[]?",
})

const parse = type("string")
	.pipe((s) => JSON.parse(s))
	.pipe(nodeJsManifest)

export function extractPackageJson(source: Source, content: Buffer<ArrayBuffer>): Extraction {
	source.inverted = true
	const dist = parse(content.toString())
	if (dist instanceof type.errors) {
		source.error = dist
		return "continue"
	}

	if (!dist.files) {
		return "continue"
	}

	for (const pattern of dist.files) {
		sourcePushNegatable(source, pattern)
	}

	return "continue"
}

extractPackageJson satisfies SourceExtractor
