import {
	type Extractor,
	extractGitignore,
	signedPatternIgnores,
	signedPatternCompile,
	type SignedPattern,
} from "../patterns/index.js"

import type { Target } from "./target.js"

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

/**
 * @since 0.0.6
 */
export const Git: Target = {
	extractors,
	ignores(o) {
		return signedPatternIgnores({
			...o,
			internal,
			root: "/",
			target: Git,
		})
	},
}
