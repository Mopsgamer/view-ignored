import { type Extractor, type SignedPattern, signedPatternIgnores } from "../patterns/matcher.js"
import { extractGitignore } from "../patterns/gitignore.js"
import { extractPackageJson } from "../patterns/packagejson.js"
import type { Target } from "./target.js"

export const Yarn: Target = {
	ignores(fs, cwd, entry, ctx) {
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
