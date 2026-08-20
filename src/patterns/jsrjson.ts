import type { ExtractorFn } from "./extractor.js"
import type { GlobRule } from "./rule.js"

import stripJsonComments from "strip-json-comments"

import { ruleCompile } from "./resolveSources.js"
import { resolveNegatable, type Source } from "./source.js"

const decoder = new TextDecoder()

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
export function extractJsrJson(source: Source, content: Uint8Array): void | Error {
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
export function extractJsrJsonRules(source: Source, content: Uint8Array): void {
	let dist: JsrManifest

	try {
		dist = JSON.parse(stripJsonComments(decoder.decode(content)))
	} catch (e) {
		throw new Error("Invalid JSON in '" + source.path + "'", { cause: e })
	}

	// Basic runtime check to ensure dist is an object
	if (!dist || typeof dist !== "object" || Array.isArray(dist)) {
		throw new Error("Invalid '" + source.path + "': Root must be an object")
	}

	let rule: GlobRule | undefined

	// Resolve patterns based on the manifest hierarchy
	const target = dist.publish ?? dist

	const options = { nocase: true }
	if (Array.isArray(target.exclude)) {
		for (const pattern of target.exclude) {
			const nextRule = resolveNegatable(pattern, false, rule)
			if (nextRule === rule) continue
			rule = nextRule
			source.rules.push(rule)
		}
	}

	if (Array.isArray(target.include)) {
		for (const pattern of target.include) {
			const nextRule = resolveNegatable(pattern, true, rule)
			if (nextRule === rule) continue
			rule = nextRule
			source.rules.push(rule)
		}
	}

	const rlen = source.rules.length
	for (let i = 0; i < rlen; i++) {
		const r = source.rules[i]!
		if ("list" in r && r.compiled === null) ruleCompile(r, options)
	}
}
