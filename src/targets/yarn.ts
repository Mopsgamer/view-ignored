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
	type PackageJson,
	extractManifestIncludes,
	symlinkRule,
	makeDirectPathsRule,
	extractNoCaseNpmignore,
} from "./npmManifest.js"

let cachedYarnExcludesRule: GlobRule | null = null
let cachedYarnIncludesRule: GlobRule | null = null

/**
 * @since 0.12.0
 */
export function makeYarn(): Target {
	const extractors: Extractor[] = [
		packageJsonExtractor,
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

	if (!cachedYarnExcludesRule) {
		cachedYarnExcludesRule = ruleCompile({
			compiled: null,
			excludes: true,
			list: [
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
		}) as GlobRule
	}

	if (!cachedYarnIncludesRule) {
		cachedYarnIncludesRule = ruleCompile(
			{
				compiled: null,
				excludes: false,
				list: [
					// https://github.com/yarnpkg/berry/blob/master/packages/plugin-pack/sources/packUtils.ts#L10
					"/package.json",
					"/README",
					"/README.*",
					"/LICENSE",
					"/LICENSE.*",
					"/LICENCE",
					"/LICENCE.*",
				],
			},
			{ nocase: true },
		) as GlobRule
	}

	const internal: Rule[] = [
		symlinkRule,
		makeDirectPathsRule(directPathsInclude),
		cachedYarnExcludesRule,
		cachedYarnIncludesRule,
	]

	return <Target>{
		extractors,
		ignores: ruleTest,
		init({ fs, cwd }, cb) {
			fs.readFile(cwd + "/package.json", (err, content) => {
				if (err) {
					if (err.code === "ENOENT") {
						cb(null)
						return
					}
					cb(new Error("Error while initializing Yarn", { cause: err }))
					return
				}

				let dist: PackageJson
				try {
					dist = npmManifestParse(content!.toString())
				} catch (error) {
					cb(new Error("Invalid 'package.json'", { cause: error }))
					return
				}

				// TODO: Yarn should include bundled deps

				extractManifestIncludes(dist, directPathsInclude)
				cb(null)
			})
		},
		internalRules: internal,
		root: ".",
	}
}
