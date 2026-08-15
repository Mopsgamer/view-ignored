import type { Extractor } from "../patterns/extractor.js"
import type { Target } from "./target.js"

import { extractJsrJson } from "../patterns/jsrjson.js"
import { packageJsonExtractor } from "../patterns/packagejson.js"
import { ruleCompile } from "../patterns/resolveSources.js"
import { ruleTest, type Rule, type GlobRule } from "../patterns/rule.js"
import { makeJsrInit } from "./jsrManifest.js"

let cachedDenoRule: GlobRule | null = null

/**
 * @since 0.12.0
 */
export function makeDeno(): Target {
	const extractors: Extractor[] = [
		{
			extract: extractJsrJson,
			path: "deno.json",
		},
		{
			extract: extractJsrJson,
			path: "deno.jsonc",
		},
		{
			extract: extractJsrJson,
			path: "jsr.json",
		},
		{
			extract: extractJsrJson,
			path: "jsr.jsonc",
		},
		packageJsonExtractor,
	]

	cachedDenoRule ||= ruleCompile({
		compiled: null,
		excludes: true,
		list: [".git", ".DS_Store", ".gitignore", "node_modules"],
	})

	const internal: Rule[] = [cachedDenoRule]

	return {
		extractors,
		ignores: ruleTest,
		init: makeJsrInit("Deno", extractors),
		internalRules: internal,
		root: ".",
	}
}
