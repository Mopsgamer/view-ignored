import {
	type SourceExtractor,
	type SignedPattern,
	signedPatternIgnores,
} from "../patterns/matcher.js"
import { extractGitignore } from "../patterns/gitignore.js"
import { extractPackageJson } from "../patterns/packagejson.js"
import type { Target } from "./target.js"

const sources = ["package.json", ".yarnignore", ".npmignore", ".gitignore"]

const extractors = new Map<string, SourceExtractor>([
	["package.json", extractPackageJson],
	[".yarnignore", extractGitignore],
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
		".yarnignore",
		".yarnrc",
	],
	include: ["bin", "package.json", "README*", "LICENSE*", "LICENCE*"],
}

export const Yarn: Target = {
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
