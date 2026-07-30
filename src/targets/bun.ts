import type { Target } from "./target.js"

import {
	type Extractor,
	ruleTest,
	type Rule,
	ruleCompile,
	extractGitignore,
	packageJsonExtractor,
	type GlobRule,
} from "../patterns/index.js"
import {
	npmManifestParse,
	type PackageJson,
	extractManifestIncludes,
	symlinkRule,
	makeDirectPathsRule,
} from "./npmManifest.js"

let cachedBunExcludesRule: GlobRule | null = null
let cachedBunIncludesRule: GlobRule | null = null

/**
 * @since 0.12.0
 */
export function makeBun(): Target {
	const extractors: Extractor[] = [
		packageJsonExtractor,
		{
			extract: extractGitignore,
			path: ".npmignore",
		},
		{
			extract: extractGitignore,
			path: ".gitignore",
		},
	]

	const directPathsInclude: Record<string, string> = Object.create(null)

	cachedBunExcludesRule ||= ruleCompile({
		compiled: null,
		excludes: true,
		list: [
			// https://github.com/oven-sh/bun/blob/main/src/cli/pack_command.zig#L180
			"package-lock.json",
			"yarn.lock",
			"pnpm-lock.yaml",
			"bun.lockb",
			"bun.lock", // npm includes it

			// https://github.com/oven-sh/bun/blob/main/src/cli/pack_command.zig#L189
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
			"wafpickle-*",
			"CVS",
			"npm-debug.log",

			// bun says it is "mentioned in the docs but does not appear to be ignored by default"
			// but we know it should be /build/config.gypi, not just config.gypi, haha
			// "config.gypi",

			".env.production", // npm includes it
			"bunfig.toml", // npm includes it

			// https://github.com/oven-sh/bun/blob/main/src/cli/pack_command.zig#L284
			// manifest should be included, but bun ignores it on this line
			// bun forces it later: https://github.com/oven-sh/bun/blob/main/src/cli/pack_command.zig#L2586
			// "package.json",

			// https://github.com/oven-sh/bun/blob/main/src/cli/pack_command.zig#L285
			"node_modules",
		],
	})

	cachedBunIncludesRule ||= ruleCompile(
		{
			compiled: null,
			excludes: false,
			list: [
				// https://github.com/oven-sh/bun/blob/main/src/cli/pack_command.zig#L2586
				"package.json",

				// the special?.* check works this way: https://github.com/oven-sh/bun/blob/main/src/cli/pack_command.zig#L2599
				"LICENSE",
				"LICENSE.*",
				"LICENCE",
				"LICENCE.*",
				"README",
				"README.*",
			],
		},
		{ nocase: true },
	)

	const internal: Rule[] = [
		symlinkRule,
		makeDirectPathsRule(directPathsInclude),
		cachedBunExcludesRule,
		cachedBunIncludesRule,
	]

	return <Target>{
		extractors,
		ignores: ruleTest,
		init({ fs, cwd }, cb) {
			fs.readFile(cwd + "/package.json", (err, content) => {
				if (err) {
					cb(new Error("Error while initializing Bun", { cause: err }))
					return
				}

				let dist: PackageJson
				try {
					dist = npmManifestParse(content!.toString())
				} catch (error) {
					cb(new Error("Invalid 'package.json'", { cause: error }))
					return
				}

				// TODO: Bun should include bundled deps

				extractManifestIncludes(dist, directPathsInclude)
				cb(null)
			})
		},
		internalRules: internal,
		root: ".",
	}
}
