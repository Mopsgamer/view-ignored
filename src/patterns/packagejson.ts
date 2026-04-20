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
export function extractPackageJson(source: Source, content: Buffer): void | null {
	const result = extract(source, content)
	if (result === undefined) {
		for (const element of source.rules) {
			ruleCompile(element)
		}
	}
	return result
}

/**
 * Extracts and compiles patterns from the file.
 *
 * @see {@link ruleCompile}
 *
 * @since 0.8.0
 */
export function extractPackageJsonNocase(source: Source, content: Buffer): void | null {
	const result = extract(source, content)
	if (result === undefined) {
		for (const element of source.rules) {
			ruleCompile(element, { nocase: true })
		}
	}
	return result
}

function extract(source: Source, content: Buffer): void | null {
	source.inverted = true
	const include: Rule = { compiled: null, excludes: false, pattern: [] }
	const exclude: Rule = { compiled: null, excludes: true, pattern: [] }

	let dist: { files?: string[] }

	try {
		dist = npmManifestParse(content.toString())
	} catch (err) {
		throw new Error("Invalid '" + source.path + "'", { cause: err })
	}

	if (!dist?.files || !Array.isArray(dist.files)) {
		return null
	}

	for (const pattern of dist.files) {
		resolveNegatable(pattern, true, include, exclude)
	}

	source.rules.push(include, exclude)
}

extractPackageJson satisfies ExtractorFn
