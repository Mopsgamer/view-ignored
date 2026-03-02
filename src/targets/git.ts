import type { Target } from "./target.js"

import {
	type Extractor,
	extractGitignore,
	ruleTest,
	ruleCompile,
	type Rule,
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

const internal: Rule[] = [
	ruleCompile({
		excludes: true,
		pattern: [".git", ".DS_Store"],
		compiled: null,
	}),
]

/**
 * @since 0.6.0
 */
export const Git: Target = {
	internalRules: internal,
	extractors,
	root: "/",
	// TODO: Git should read configs
	ignores: ruleTest,
}
