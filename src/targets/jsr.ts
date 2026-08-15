import type { Extractor } from "../patterns/extractor.js"
import type { Target } from "./target.js"

import { extractJsrJson } from "../patterns/jsrjson.js"
import { ruleCompile } from "../patterns/resolveSources.js"
import { ruleTest, type Rule, type GlobRule } from "../patterns/rule.js"
import { makeJsrInit } from "./jsrManifest.js"

let cachedJSRRule: GlobRule | null = null

/**
 * @since 0.12.0
 */
export function makeJSR(): Target {
	const extractors: Extractor[] = [
		{
			extract: extractJsrJson,
			path: "jsr.json",
		},
		{
			extract: extractJsrJson,
			path: "jsr.jsonc",
		},
	]

	cachedJSRRule ||= ruleCompile({
		compiled: null,
		excludes: true,
		list: [".git", ".DS_Store", ".gitignore", "node_modules"],
	})

	const internal: Rule[] = [cachedJSRRule]

	return {
		extractors,
		ignores: ruleTest,
		init: makeJsrInit("JSR", extractors),
		internalRules: internal,
		root: ".",
	}
}
