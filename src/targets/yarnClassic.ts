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
		path: ".yarnignore",
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
		// https://github.com/yarnpkg/berry/blob/master/packages/plugin-pack/sources/packUtils.ts#L26
		".git",
		"CVS",
		".svn",
		".hg",

		"node_modules",

		"yarn.lock",
		".lock-wscript",
		".wafpickle-0",
		".wafpickle-1",
		".wafpickle-2",
		".wafpickle-3",
		".wafpickle-4",
		".wafpickle-5",
		".wafpickle-6",
		".wafpickle-7",
		".wafpickle-8",
		".wafpickle-9",
		"*.swp",
		"._*",
		"npm-debug.log",
		"yarn-error.log",
		".npmrc",
		".yarnrc",
		".yarnrc.yml",
		".npmignore",
		".gitignore",
		".DS_Store",
	],
	include: [
		// https://github.com/yarnpkg/berry/blob/master/packages/plugin-pack/sources/packUtils.ts#L10
		"/package.json",
		"/readme*",
		"/license*",
		"/licence*",
		"/changes*",
		"/changelog*",
		"/history*",
	],
	compiled: null,
}

signedPatternCompile(internal)

/**
 * @since 0.6.0
 */
export const YarnClassic: Target = {
	extractors,
	ignores(o) {
		return signedPatternIgnores({
			...o,
			internal,
			root: ".",
			target: YarnClassic,
		})
	},
}
