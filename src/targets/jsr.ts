import {
	type SourceExtractor,
	type SignedPattern,
	signedPatternIgnores,
} from "../patterns/matcher.js"
import { extractJsrJson, extractJsrJsonc } from "../patterns/jsrjson.js"
import type { Target } from "./target.js"

const sources = ["deno.json", "deno.jsonc", "jsr.json", "jsr.jsonc"]

const extractors = new Map<string, SourceExtractor>([
	["deno.json", extractJsrJson],
	["deno.jsonc", extractJsrJsonc],
	["jsr.json", extractJsrJson],
	["jsr.jsonc", extractJsrJsonc],
])

const internal: SignedPattern = {
	exclude: [".git", ".DS_Store"],
	include: [],
}

export const JSR: Target = {
	ignores(cwd, entry, ctx) {
		return signedPatternIgnores({
			internal,
			ctx,
			cwd,
			entry,
			sources,
			extractors,
		})
	},
}
