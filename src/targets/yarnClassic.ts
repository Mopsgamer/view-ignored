import type { Target } from "./target.js"

import {
	type Extractor,
	ruleTest,
	type Rule,
	ruleCompile,
	makePackageJsonExtractor,
	makeGitignoreExtractor,
	MatchMode,
} from "../patterns/index.js"
import { unixify } from "../unixify.js"
import { npmManifestParse } from "./npmManifest.js"

const extractors: Extractor[] = [
	makePackageJsonExtractor("package.json", MatchMode.unsensitive),
	makeGitignoreExtractor(".yarnignore", MatchMode.unsensitive),
	makeGitignoreExtractor(".npmignore", MatchMode.unsensitive),
	makeGitignoreExtractor(".gitignore", MatchMode.unsensitive),
]

const internal: Rule[] = [
	ruleCompile(
		{
			compiled: null,
			excludes: true,
			pattern: [
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
		},
		MatchMode.unsensitive,
	),
	ruleCompile(
		{
			compiled: null,
			excludes: false,
			pattern: [
				// https://github.com/yarnpkg/berry/blob/master/packages/plugin-pack/sources/packUtils.ts#L10
				"/package.json",
				"/readme*",
				"/license*",
				"/licence*",
				"/changes*",
				"/changelog*",
				"/history*",
			],
		},
		MatchMode.unsensitive,
	),
]

/**
 * @since 0.8.0
 */
export const YarnClassic: Target = <Target>{
	extractors,
	ignores: ruleTest,
	init({ fs, cwd }, cb) {
		const normalCwd = unixify(cwd)
		fs.readFile(normalCwd + "/package.json", (err, content) => {
			if (err) {
				cb(new Error("Error while initializing Yarn classic", { cause: err }))
				return
			}

			try {
				npmManifestParse(content!.toString())
			} catch (error) {
				cb(new Error("Invalid 'package.json'", { cause: error }))
				return
			}
			cb()
		})
	},
	internalRules: internal,
	root: ".",
}
