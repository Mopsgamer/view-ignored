import type { Extractor } from "../patterns/extractor.js"
import type { Target } from "./target.js"
import {
	signedPatternCompile,
	signedPatternIgnores,
	type SignedPattern,
} from "../patterns/index.js"
import { extractJsrJson, extractJsrJsonc } from "../patterns/jsrjson.js"

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
			extractors,
		})
	},
}
