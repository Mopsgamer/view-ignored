import type { Target } from "./target.js"

import {
	type Extractor,
	ruleTest,
	type Rule,
	ruleCompile,
	extractPackageJson,
	extractGitignore,
	type CustomRule,
} from "../patterns/index.js"
import { npmManifestParse, extractManifestIncludes } from "./npmManifest.js"

/**
 * @since 0.12.0
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

	const directPathsInclude: Record<string, string> = Object.create(null)

	const internal: Rule[] = [
		{
			excludes: true,
			match({ dirent }) {
				return dirent.isSymbolicLink() ? "//symlink" : null
			},
		} satisfies CustomRule as CustomRule,
		{
			excludes: false,
			match({ entry }) {
				for (const [manifestProp, path] of Object.entries(directPathsInclude)) {
					if (entry === path) {
						return "//'" + manifestProp + "' property is " + path
					}
				}
				return null
			},
		} satisfies CustomRule as CustomRule,
		ruleCompile(
			{
				compiled: null,
				excludes: true,
				list: [
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
				list: [
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

				let dist
				try {
					dist = npmManifestParse(content!.toString())
				} catch (error) {
					cb(new Error("Invalid 'package.json'", { cause: error }))
					return
				}

				extractManifestIncludes(dist, directPathsInclude)
				cb(null)
			})
		},
		internalRules: internal,
		root: ".",
	}
}
