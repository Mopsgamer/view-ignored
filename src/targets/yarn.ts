import type { Extractor } from "../patterns/extractor.js"
import type { Target } from "./target.js"

import { makePackageJsonExtractor } from "../patterns/packagejson.js"
import { ruleCompile } from "../patterns/resolveSources.js"
import { ruleTest, type Rule, type GlobRule } from "../patterns/rule.js"
import {
	createNpmContext,
	initNpmContext,
	makePatchedDepsRule,
	makePackageResolutionRule,
	makeBundledDepsRule,
	symlinkRule,
	makeDirectPathsRule,
	extractNoCaseNpmignore,
} from "./npmManifest.js"

let cachedYarnExcludesRule: GlobRule | null = null
let cachedYarnIncludesRule: GlobRule | null = null

/**
 * Creates a Yarn Berry target where `mode` controls default rules:
 * - `'publish'`: applies default exclusions (e.g. `.git`, `node_modules`).
 * - `'bundle'`: omits default exclusions so bundled dependencies remain included.
 * - `'list'`: lists files without applying publish-specific exclusions.
 *
 * @since 0.12.0
 */
export function makeYarn(mode: "list" | "publish" | "bundle" = "publish"): Target {
	const ctx = createNpmContext(mode)

	const extractors: Extractor[] = [
		makePackageJsonExtractor(mode),
		{
			extract: extractNoCaseNpmignore,
			path: ".npmignore",
		},
		{
			extract: extractNoCaseNpmignore,
			path: ".gitignore",
		},
	]

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
		makeBundledDepsRule(ctx, makeYarn),
		makePackageResolutionRule(ctx),
		symlinkRule,
		makePatchedDepsRule(ctx),
		ctx.npmIgnoreExcludeGlobRule,
		makeDirectPathsRule(ctx.directPathsInclude),
		cachedYarnExcludesRule,
		cachedYarnIncludesRule,
	]

	return {
		extendsRoot: "workspaces",
		extractors,
		ignores: ruleTest,
		init(options, cb) {
			initNpmContext(ctx, options, cb)
		},
		internalRules: internal,
		root: ".",
	}
}
