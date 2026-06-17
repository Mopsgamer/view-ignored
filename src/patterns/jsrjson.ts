import type { ExtractorFn } from "./extractor.js"
import type { Rule } from "./rule.js"

import stripJsonComments from "strip-json-comments"

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
	try {
		extractJsrJsonRules(source, content)
	} catch (e) {
		return e as Error
	}
}

extractJsrJson satisfies ExtractorFn

/**
 * Extracts and compiles patterns from the file.
 *
 * @since 0.12.0
 */
export function extractJsrJsonRules(
	source: Source,
	content: Buffer,
): { exclude: Rule; include: Rule } {
	let dist: JsrManifest

	try {
		dist = JSON.parse(stripJsonComments(content.toString()))
	} catch (e) {
		throw new Error("Invalid JSON in '" + source.path + "'", { cause: e })
	}

	// Basic runtime check to ensure dist is an object
	if (!dist || typeof dist !== "object" || Array.isArray(dist)) {
		throw new Error("Invalid '" + source.path + "': Root must be an object")
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

	const options = { nocase: true }
	if (include.pattern.length > 0) {
		ruleCompile(include, options)
		source.rules.push(include)
	}
	if (exclude.pattern.length > 0) {
		ruleCompile(exclude, options)
		source.rules.push(exclude)
	}

	return { exclude, include }
}
