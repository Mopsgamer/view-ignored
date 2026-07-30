import type { Target } from "./target.js"

import {
	type Extractor,
	ruleTest,
	type Rule,
	ruleCompile,
	extractJsrJson,
	packageJsonExtractor,
} from "../patterns/index.js"
import { makeJsrInit } from "./jsrManifest.js"

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

	const internal: Rule[] = [
		ruleCompile({
			compiled: null,
			excludes: true,
			list: [".git", ".DS_Store"],
		}),
	]

	return <Target>{
		extractors,
		ignores: ruleTest,
		init: makeJsrInit("Deno", extractors),
		internalRules: internal,
		root: ".",
	}
}
