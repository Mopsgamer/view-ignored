import { type Extractor, type SignedPattern, signedPatternIgnores } from "../patterns/matcher.js"
import { extractJsrJson, extractJsrJsonc } from "../patterns/jsrjson.js"
import type { Target } from "./target.js"

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
