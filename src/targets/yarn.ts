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

	cachedYarnExcludesRule ||= ruleCompile({
		compiled: null,
		excludes: true,
		list: [
			// The list of standard ignored patterns defined by Yarn Berry plugin-pack when walking package directories.
			// https://github.com/yarnpkg/berry/blob/57081c05a398f25c92df1dc78752f2053576cec0/packages/plugin-pack/sources/packUtils.ts#L23
			"/package.tgz",

			".github",
			".git",
			".hg",
			"node_modules",

			".npmignore",
			".gitignore",

			".#*",
			".DS_Store",
			"/.npm-extension.mjs",
			"/.npm-extension.cjs",
		],
	})

	cachedYarnIncludesRule ||= ruleCompile(
		{
			compiled: null,
			excludes: false,
			list: [
				// The list of files that Yarn Berry unconditionally packs (never ignores) such as README and LICENSE.
				// https://github.com/yarnpkg/berry/blob/57081c05a398f25c92df1dc78752f2053576cec0/packages/plugin-pack/sources/packUtils.ts#L9
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
	)

	const internal: Rule[] = [
		symlinkRule,
		makeDirectPathsRule(directPathsInclude),
		cachedYarnExcludesRule,
		cachedYarnIncludesRule,
	]

	return <Target>{
		extendsRoot: "workspaces",
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
