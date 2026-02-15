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
		// https://github.com/npm/npm-packlist/blob/main/lib/index.js#L16
		".npmignore",
		".gitignore",
		".git",
		".svn",
		".hg",
		"CVS",
		".git",
		".svn",
		".hg",
		"CVS",
		"/.lock-wscript",
		"/.wafpickle-*",
		"/build/config.gypi",
		"npm-debug.log",
		".npmrc",
		".*.swp",
		".DS_Store",
		"._*",
		"*.orig",
		"/archived-packages/**",

		// https://github.com/npm/npm-packlist/blob/main/lib/index.js#L294
		"/node_modules",
		"/package-lock.json",
		"/yarn.lock",
		"/pnpm-lock.yaml",
		"/bun.lockb",
	],
	include: [
		// https://github.com/npm/npm-packlist/blob/main/lib/index.js#L287
		"bin",
		"package.json",
		"README",
		"COPYING",
		"LICENSE",
		"LICENCE",
		"README.*",
		"COPYING.*",
		"LICENSE.*",
		"LICENCE.*",
	],
	compiled: null,
}

signedPatternCompile(internal)

/**
 * @since 0.6.0
 */
export const NPM: Target = {
	// TODO: NPM should validate package.json
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
