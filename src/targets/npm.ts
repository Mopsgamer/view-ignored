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
		path: ".npmignore",
	},
	{
		extract: extractGitignore,
		path: ".gitignore",
	},
]

const internal: SignedPattern = {
	exclude: [
		".git",
		".DS_Store",
		"node_modules",
		".*.swp",
		"._*",
		".DS_Store",
		".git",
		".gitignore",
		".hg",
		".npmignore",
		".npmrc",
		".lock-wscript",
		".svn",
		".wafpickle-*",
		"config.gypi",
		"CVS",
		"npm-debug.log",
	],
	include: ["bin", "package.json", "README*", "LICENSE*", "LICENCE*"],
	compiled: null,
}

signedPatternCompile(internal)

/**
 * @since 0.0.6
 */
export const NPM: Target = {
	extractors,
	ignores(o) {
		return signedPatternIgnores({
			...o,
			internal,
			root: ".",
			target: NPM,
		})
	},
}
