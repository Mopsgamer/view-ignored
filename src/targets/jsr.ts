import type { Target } from "./target.js"

import {
	type Extractor,
	ruleTest,
	type Rule,
	ruleCompile,
	extractJsrJson,
} from "../patterns/index.js"
import { makeJsrInit } from "./jsrManifest.js"

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
		init: makeJsrInit("JSR", extractors),
		internalRules: internal,
		root: ".",
	}
}
