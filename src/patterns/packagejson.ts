import { type } from "arktype"

import type { ExtractorFn } from "./extractor.js"
import { signedPatternCompile } from "./resolveSources.js"
import { sourcePushNegatable, type Source } from "./source.js"

const nodeJsManifest = type({
	files: "string[]?",
})

const parse = type("string")
	.pipe((s) => JSON.parse(s))
	.pipe(nodeJsManifest)

/**
 * Extracts and compiles patterns from the file.
 *
 * @see {@link signedPatternCompile}
 */
export function extractPackageJson(source: Source, content: Buffer): void | "none" {
	source.inverted = true
	const dist = parse(content.toString())
	if (dist instanceof type.errors) {
		source.error = new Error("Invalid '" + source.path + "': " + dist.summary, { cause: dist })
		return
	}

	if (!dist.files) {
		return "none"
	}

	for (const pattern of dist.files) {
		sourcePushNegatable(source, pattern)
	}
	signedPatternCompile(source.pattern)
}

extractPackageJson satisfies ExtractorFn
