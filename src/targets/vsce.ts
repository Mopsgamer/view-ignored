import {
	type Extractor,
	signedPatternIgnores,
	type SignedPattern,
	signedPatternCompile,
	extractPackageJson,
	extractGitignore,
} from "../patterns/index.js"

import type { Target } from "./target.js"

const extractors: Extractor[] = [
	{
		extract: extractPackageJson,
		path: "package.json",
	},
	{
		extract: extractGitignore,
		path: ".vscodeignore",
	},
	{
		extract: extractGitignore,
		path: ".gitignore",
	},
]

const internal: SignedPattern = {
	exclude: [".git", ".DS_Store"],
	include: [],
	compiled: null,
}

signedPatternCompile(internal)

export const VSCE: Target = {
	extractors,
	ignores(fs, cwd, entry, ctx) {
		return signedPatternIgnores({
			fs,
			internal,
			ctx,
			cwd,
			entry,
			root: ".",
			target: VSCE,
		})
	},
}
