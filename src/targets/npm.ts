import type { Extractor } from "../patterns/extractor.js"
import type { Target } from "./target.js"
import {
	signedPatternCompile,
	signedPatternIgnores,
	type SignedPattern,
} from "../patterns/index.js"
import { extractGitignore } from "../patterns/gitignore.js"
import { extractPackageJson } from "../patterns/packagejson.js"

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

export const NPM: Target = {
	extractors,
	ignores(fs, cwd, entry, ctx) {
		return signedPatternIgnores({
			fs,
			internal,
			ctx,
			cwd,
			entry,
			extractors,
		})
	},
}
