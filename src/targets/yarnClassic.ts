import type { Target } from "./target.js"

import {
	type Extractor,
	ruleTest,
	type Rule,
	ruleCompile,
	packageJsonExtractor,
	type GlobRule,
} from "../patterns/index.js"
import {
	npmManifestParse,
	extractManifestIncludes,
	symlinkRule,
	makeDirectPathsRule,
	extractNoCaseNpmignore,
} from "./npmManifest.js"

let cachedYarnClassicExcludesRule: GlobRule | null = null
let cachedYarnClassicIncludesRule: GlobRule | null = null

/**
 * @since 0.12.0
 */
export function makeYarnClassic(): Target {
	const extractors: Extractor[] = [
		packageJsonExtractor,
		{
			extract: extractNoCaseNpmignore,
			path: ".yarnignore",
		},
		{
			extract: extractNoCaseNpmignore,
			path: ".npmignore",
		},
		{
			extract: extractNoCaseNpmignore,
			path: ".gitignore",
		},
	]

	const directPathsInclude: Record<string, string> = Object.create(null)

	cachedYarnClassicExcludesRule ||= ruleCompile(
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
	)

	cachedYarnClassicIncludesRule ||= ruleCompile(
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
	)

	const internal: Rule[] = [
		symlinkRule,
		makeDirectPathsRule(directPathsInclude),
		cachedYarnClassicExcludesRule,
		cachedYarnClassicIncludesRule,
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
