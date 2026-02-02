import type { Extractor } from "../patterns/extractor.js"
import type { Target } from "./target.js"
import { signedPatternIgnores, type SignedPattern } from "../patterns/index.js"
import { extractJsrJson, extractJsrJsonc } from "../patterns/jsrjson.js"

export const JSR: Target = {
	ignores(fs, cwd, entry, ctx) {
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
		}

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
