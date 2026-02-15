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
 * @since 0.6.0
 */
export const Git: Target = {
	// TODO: Git should read configs
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
