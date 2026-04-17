import { type } from "arktype"

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
export function extractPackageJson(source: Source, content: Buffer): void | "none" {
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
export function extractPackageJsonNocase(source: Source, content: Buffer): void | "none" {
	const result = extract(source, content)
	if (result === undefined) {
		for (const element of source.rules) {
			ruleCompile(element, { nocase: true })
		}
	}
	return result
}

function extract(source: Source, content: Buffer): void | "none" {
	source.inverted = true
	const include: Rule = { compiled: null, excludes: false, pattern: [] }
	const exclude: Rule = { compiled: null, excludes: true, pattern: [] }
	const dist = npmManifestParse(content.toString())
	if (dist instanceof type.errors) {
		throw new Error("Invalid '" + source.path + "': " + dist.summary, { cause: dist })
	}

	if (!dist.files) {
		return "none"
	}

	for (const pattern of dist.files) {
		resolveNegatable(pattern, true, include, exclude)
	}
	source.rules.push(include, exclude)
}

extractPackageJson satisfies ExtractorFn
