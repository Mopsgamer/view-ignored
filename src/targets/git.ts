import type { Target } from "./target.js"

import {
	type Extractor,
	extractGitignore,
	signedPatternIgnores,
	signedPatternCompile,
	type SignedPattern,
} from "../patterns/index.js"

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

const internal: SignedPattern[] = [
	signedPatternCompile({
		excludes: true,
		pattern: [".git", ".DS_Store"],
		compiled: null,
	}),
]

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
