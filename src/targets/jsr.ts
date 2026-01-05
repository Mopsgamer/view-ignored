import {
	type SourceExtractor,
	type SignedPattern,
	signedPatternIgnores,
} from "../patterns/matcher.js"
import { extractJsrJson, extractJsrJsonc } from "../patterns/jsrjson.js"
import type { Target } from "./target.js"

export const JSR: Target = {
	ignores(cwd, entry, ctx) {
		const jsrSources = ["deno.json", "deno.jsonc", "jsr.json", "jsr.jsonc"]
		const jsrSourceMap = new Map<string, SourceExtractor>([
			["deno.json", extractJsrJson],
			["deno.jsonc", extractJsrJsonc],
			["jsr.json", extractJsrJson],
			["jsr.jsonc", extractJsrJsonc],
		])
		const vscePattern: SignedPattern = {
			exclude: [".git", ".DS_Store"],
			include: [],
		}
		return signedPatternIgnores(vscePattern, cwd, entry, jsrSources, jsrSourceMap, ctx)
	},
}
