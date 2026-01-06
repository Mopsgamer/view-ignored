import {
	type SourceExtractor,
	type SignedPattern,
	signedPatternIgnores,
} from "../patterns/matcher.js"
import { extractGitignore } from "../patterns/gitignore.js"
import { extractPackageJson } from "../patterns/packagejson.js"
import type { Target } from "./target.js"

const sources = ["package.json", ".npmignore", ".gitignore"]

const extractors = new Map<string, SourceExtractor>([
	["package.json", extractPackageJson],
	[".npmignore", extractGitignore],
	[".gitignore", extractGitignore],
])

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
}

export const NPM: Target = {
	ignores(cwd, entry, ctx) {
		return signedPatternIgnores(internal, {
			ctx,
			cwd,
			entry,
			sources,
			extractors,
		})
	},
}
