import type { Extractor, ExtractorFn } from "./extractor.js"
import type { GlobRule } from "./rule.js"

import { npmManifestParse } from "../targets/npmManifest.js"
import { ruleCompile } from "./resolveSources.js"
import { resolveNegatable, type Source } from "./source.js"

const decoder = new TextDecoder()

/**
 * Extracts and compiles patterns from the file.
 *
 * @see {@link ruleCompile}
 *
 * @since 0.6.0
 */
export function extractPackageJson(source: Source, content: Uint8Array): void | null | Error {
	try {
		return extractPackageJsonRules(source, content)
	} catch (e) {
		return e as Error
	}
}

extractPackageJson satisfies ExtractorFn

export function makePackageJsonExtractor(
	mode: "list" | "publish" | "bundle" = "publish",
): Extractor {
	return {
		extract(source, content) {
			try {
				return extractPackageJsonRules(source, content, mode)
			} catch (e) {
				return e as Error
			}
		},
		path: "./package.json",
	}
}

export const packageJsonExtractor: Extractor = makePackageJsonExtractor("publish")

/**
 * Extracts and compiles patterns from the file.
 *
 * @since 0.12.0
 */
export function extractPackageJsonRules(
	source: Source,
	content: Uint8Array,
	mode: "list" | "publish" | "bundle" = "publish",
): void | null {
	let dist: { files?: string[] }

	try {
		dist = npmManifestParse(decoder.decode(content), mode)
	} catch (err) {
		throw new Error("Invalid '" + source.path + "'", { cause: err })
	}

	if (!dist || !Array.isArray(dist.files)) return null

	source.inverted = true
	let rule: GlobRule | undefined

	const options = { nocase: true }
	for (const pattern of dist.files) {
		const nextRule = resolveNegatable(pattern, true, rule)
		if (nextRule === rule) continue
		rule = nextRule
		source.rules.unshift(rule)
	}

	const rlen = source.rules.length
	for (let i = 0; i < rlen; i++) {
		const r = source.rules[i]!
		if ("list" in r && r.compiled === null) ruleCompile(r, options)
	}
}
