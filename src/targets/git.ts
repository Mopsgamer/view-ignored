import type { Extractor } from "../patterns/extractor.js"
import type { Target } from "./target.js"
import {
	signedPatternCompile,
	signedPatternIgnores,
	type SignedPattern,
} from "../patterns/signedPattern.js"
import { extractGitignore } from "../patterns/gitignore.js"

const extractors: Extractor[] = [
	{
		extract: extractGitignore,
		path: ".gitignore",
	},
	{
		extract: extractGitignore,
		path: ".git/info/exclude",
	},
]

const internal: SignedPattern = {
	exclude: [".git", ".DS_Store"],
	include: [],
	compiled: null,
}

signedPatternCompile(internal)

export const Git: Target = {
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
