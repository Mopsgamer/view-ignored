import type { Extractor, ExtractorFn } from "./extractor.js"
import type { GlobRule } from "./rule.js"

import { npmManifestParse } from "../targets/npmManifest.js"
import { resolveNegatable, type Source } from "./source.js"

/**
 * Extracts and compiles patterns from the file.
 *
 * @see {@link ruleCompile}
 *
 * @since 0.6.0
 */
export function extractPackageJson(source: Source, content: Buffer): void | null | Error {
	try {
		const r = extractPackageJsonRules(source, content)
		if (r === null) return null
	} catch (e) {
		return e as Error
	}
}

extractPackageJson satisfies ExtractorFn

export const packageJsonExtractor: Extractor = {
	extract: extractPackageJson,
	path: "package.json",
}

/**
 * Extracts and compiles patterns from the file.
 *
 * @since 0.12.0
 */
export function extractPackageJsonRules(source: Source, content: Buffer): void | null {
	let dist: { files?: string[] }

	try {
		dist = npmManifestParse(content.toString())
	} catch (err) {
		throw new Error("Invalid '" + source.path + "'", { cause: err })
	}

	if (!dist?.files || !Array.isArray(dist.files)) {
		return null
	}

	source.inverted = true
	let rule: GlobRule | undefined

	const options = { nocase: true }
	for (const pattern of dist.files) {
		source.rules.unshift((rule = resolveNegatable(pattern, true, options, rule)))
	}
}
