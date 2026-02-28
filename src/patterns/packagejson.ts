import { type } from "arktype"

import type { ExtractorFn } from "./extractor.js"
import type { SignedPattern } from "./signedPattern.js"

import { npmManifestParse } from "../targets/npmManifest.js"
import { signedPatternCompile } from "./resolveSources.js"
import { sourcePushNegatable, type Source } from "./source.js"

/**
 * Extracts and compiles patterns from the file.
 *
 * @see {@link signedPatternCompile}
 *
 * @since 0.6.0
 */
export function extractPackageJson(source: Source, content: Buffer): void | "none" {
	const result = extract(source, content)
	if (result === undefined) {
		for (const element of source.pattern) {
			signedPatternCompile(element)
		}
	}
	if (result === "error") return
	return result
}

/**
 * Extracts and compiles patterns from the file.
 *
 * @see {@link signedPatternCompile}
 *
 * @since 0.8.0
 */
export function extractPackageJsonNocase(source: Source, content: Buffer): void | "none" {
	const result = extract(source, content)
	if (result === undefined) {
		for (const element of source.pattern) {
			signedPatternCompile(element, { nocase: true })
		}
	}
	if (result === "error") return
	return result
}

function extract(source: Source, content: Buffer): void | "error" | "none" {
	source.inverted = true
	const include: SignedPattern = { compiled: null, excludes: false, pattern: [] }
	const exclude: SignedPattern = { compiled: null, excludes: true, pattern: [] }
	const dist = npmManifestParse(content.toString())
	if (dist instanceof type.errors) {
		source.error = new Error("Invalid '" + source.path + "': " + dist.summary, { cause: dist })
		return "error"
	}

	if (!dist.files) {
		return "none"
	}

	for (const pattern of dist.files) {
		sourcePushNegatable(pattern, true, include, exclude)
	}
	source.pattern.push(include, exclude)
}

extractPackageJson satisfies ExtractorFn
