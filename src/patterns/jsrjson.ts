import type { ExtractorFn } from "./extractor.js"
import type { Rule } from "./rule.js"

import stripJsonComments from "strip-json-comments"

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
export function extractJsrJsonRules(source: Source, content: Buffer): void {
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

	let rule: Rule | undefined

	// Resolve patterns based on the manifest hierarchy
	const target = dist.publish ?? dist

	const options = { nocase: true }
	if (target.exclude && Array.isArray(target.exclude)) {
		for (const pattern of target.exclude) {
			source.rules.push((rule = resolveNegatable(pattern, false, options, rule)))
		}
	}

	if (target.include && Array.isArray(target.include)) {
		for (const pattern of target.include) {
			source.rules.push((rule = resolveNegatable(pattern, true, options, rule)))
		}
	}
}
