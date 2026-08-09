import type { Target } from "./target.js"

import {
	type Extractor,
	ruleTest,
	type Rule,
	ruleCompile,
	extractJsrJson,
	packageJsonExtractor,
	type GlobRule,
} from "../patterns/index.js"
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
