import stripJsonComments from "strip-json-comments"

import type { ExtractorFn } from "./extractor.js"
import type { Rule } from "./rule.js"

import { ruleCompile } from "./resolveSources.js"
import { resolveNegatable, type Source } from "./source.js"

interface JsrManifest {
	exclude?: string[]
	include?: string[]
	publish?: {
		exclude?: string[]
		include?: string[]
	}
}

/**
 * Extracts and compiles patterns from the file.
 *
 * @since 0.6.0
 */
export function extractJsrJson(source: Source, content: Buffer): void | Error {
	const result = extract(source, content)
	if (result instanceof Error) return result
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
export function extractJsrJsonc(source: Source, content: Buffer): void | Error {
	return extractJsrJson(source, Buffer.from(stripJsonComments(content.toString())))
}

extractJsrJsonc satisfies ExtractorFn

function extract(source: Source, content: Buffer): void | Error {
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
}
