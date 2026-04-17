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
		compiled: null,
		excludes: true,
		pattern: [".git", ".DS_Store"],
	}),
]

/**
 * @since 0.6.0
 */
export const Git: Target = {
	extractors,
	// TODO: Git should read configs
	ignores: ruleTest,
	internalRules: internal,
	root: "/",
}
