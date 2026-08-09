import type { Target } from "./target.js"

import {
	type Extractor,
	ruleTest,
	type Rule,
	ruleCompile,
	extractJsrJson,
	type GlobRule,
} from "../patterns/index.js"
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
