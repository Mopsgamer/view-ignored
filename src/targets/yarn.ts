import type { Target } from "./target.js"

import {
	type Extractor,
	ruleTest,
	type Rule,
	ruleCompile,
	extractGitignore,
	extractPackageJson,
	type CustomRule,
} from "../patterns/index.js"
import { npmManifestParse, type PackageJson, extractManifestIncludes } from "./npmManifest.js"

/**
 * @since 0.12.0
 */
export function makeYarn(): Target {
	const extractors: Extractor[] = [
		{
			extract: extractPackageJson,
			path: "package.json",
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
		ruleCompile({
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
		}),
		ruleCompile(
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
		),
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
