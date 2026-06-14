import type { Target } from "./target.js"

import {
	type Extractor,
	ruleTest,
	type Rule,
	ruleCompile,
	extractPackageJson,
	extractGitignore,
} from "../patterns/index.js"
import { npmManifestParse } from "./npmManifest.js"

/**
 * @since 0.11.2
 */
export function makeYarnClassic(): Target {
	const extractors: Extractor[] = [
		{
			extract: extractPackageJson,
			path: "package.json",
		},
		{
			extract(source, content) {
				return extractGitignore(source, content, { nocase: true })
			},
			path: ".yarnignore",
		},
		{
			extract(source, content) {
				return extractGitignore(source, content, { nocase: true })
			},
			path: ".npmignore",
		},
		{
			extract(source, content) {
				return extractGitignore(source, content, { nocase: true })
			},
			path: ".gitignore",
		},
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
			{ nocase: true },
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
			{ nocase: true },
		),
	]

	return <Target>{
		extractors,
		ignores: ruleTest,
		init({ fs, cwd }, cb) {
			fs.readFile(cwd + "/package.json", (err, content) => {
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
				cb(null)
			})
		},
		internalRules: internal,
		needsSource: true, // package.json without files prop is a valid source
		root: ".",
	}
}
