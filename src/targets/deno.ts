import type { Target } from "./target.js"

import {
	type Extractor,
	signedPatternIgnores,
	type SignedPattern,
	signedPatternCompile,
	extractJsrJson,
	extractJsrJsonc,
} from "../patterns/index.js"

const extractors: Extractor[] = [
	{
		extract: extractJsrJson,
		path: "deno.json",
	},
	{
		extract: extractJsrJsonc,
		path: "deno.jsonc",
	},
	{
		extract: extractJsrJson,
		path: "jsr.json",
	},
	{
		extract: extractJsrJsonc,
		path: "jsr.jsonc",
	},
]

const internal: SignedPattern[] = [
	signedPatternCompile({
		excludes: true,
		pattern: [".git", ".DS_Store"],
		compiled: null,
	}),
]

/**
 * @since 0.8.1
 */
export const Deno: Target = {
	// TODO: Deno should validate manifest
	extractors,
	ignores(o) {
		return signedPatternIgnores({
			...o,
			internal,
			root: ".",
			target: Deno,
		})
	},
}
