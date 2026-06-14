import type { ExtractorFn } from "./extractor.js"
import type { Rule } from "./rule.js"

import { npmManifestParse } from "../targets/npmManifest.js"
import { ruleCompile } from "./resolveSources.js"
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

/**
 * Extracts and compiles patterns from the file.
 *
 * @since 0.11.2
 */
export function extractPackageJsonRules(
	source: Source,
	content: Buffer,
): { exclude: Rule; include: Rule } | null {
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
	const include: Rule = { compiled: null, excludes: false, pattern: [] }
	const exclude: Rule = { compiled: null, excludes: true, pattern: [] }

	for (const pattern of dist.files) {
		resolveNegatable(pattern, true, include, exclude)
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
