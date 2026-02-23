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
 * @since 0.6.0
 */
export const JSR: Target = {
	// TODO: JSR should validate manifest
	extractors,
	ignores(o) {
		return signedPatternIgnores({
			...o,
			internal,
			root: ".",
			target: JSR,
		})
	},
}
