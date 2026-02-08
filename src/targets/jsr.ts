import {
	type Extractor,
	signedPatternIgnores,
	type SignedPattern,
	signedPatternCompile,
	extractJsrJson, extractJsrJsonc
} from "../patterns/index.js"

import type { Target } from "./target.js"

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

const internal: SignedPattern = {
	exclude: [".git", ".DS_Store"],
	include: [],
	compiled: null,
}

signedPatternCompile(internal)

export const JSR: Target = {
	extractors,
	ignores(fs, cwd, entry, ctx) {
		return signedPatternIgnores({
			fs,
			internal,
			ctx,
			cwd,
			entry,
			root: ".",
			target: JSR,
		})
	},
}
