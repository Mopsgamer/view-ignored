import {
	type Extractor,
	signedPatternIgnores,
	type SignedPattern,
	signedPatternCompile,
	extractPackageJsonNocase,
	extractGitignoreNocase,
} from "../patterns/index.js"

import type { Target } from "./target.js"

const extractors: Extractor[] = [
	{
		extract: extractPackageJsonNocase,
		path: "package.json",
	},
	{
		extract: extractGitignoreNocase,
		path: ".npmignore",
	},
	{
		extract: extractGitignoreNocase,
		path: ".gitignore",
	},
]

const internal: SignedPattern = {
	exclude: [
		// https://github.com/yarnpkg/berry/blob/master/packages/plugin-pack/sources/packUtils.ts#L26
		"/package.tgz",

		".github",
		".git",
		".hg",
		"node_modules",

		".npmignore",
		".gitignore",

		".#*",
		".DS_Store",
	],
	include: [
		// https://github.com/yarnpkg/berry/blob/master/packages/plugin-pack/sources/packUtils.ts#L10
		// TODO: https://github.com/yarnpkg/berry/blob/master/packages/plugin-pack/sources/packUtils.ts#L215-L231
		"/package.json",
		"/README",
		"/README.*",
		"/LICENSE",
		"/LICENSE.*",
		"/LICENCE",
		"/LICENCE.*",
	],
	compiled: null,
}

signedPatternCompile(internal, { nocase: true })

/**
 * @since 0.6.0
 */
export const Yarn: Target = {
	extractors,
	ignores(o) {
		return signedPatternIgnores({
			...o,
			internal,
			root: ".",
			target: Yarn,
		})
	},
}
