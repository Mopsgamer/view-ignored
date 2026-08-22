import type { Target } from "./target.js"

import {
	type Extractor,
	ruleTest,
	ruleCompile,
	type GlobRule,
	type InternalRules,
} from "../patterns/index.js"
import { makePackageJsonExtractor } from "../patterns/packagejson.js"
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

let cachedYarnClassicAfterExcludesRule: GlobRule | null = null
let cachedYarnClassicExcludesRule: GlobRule | null = null
let cachedYarnClassicIncludesRule: GlobRule | null = null

/**
 * Creates a Yarn Classic (v1) target where `mode` controls default rules:
 * - `'publish'`: applies default exclusions (e.g. `.git`, `.yarnignore`, `.npmignore`).
 * - `'bundle'`: omits default exclusions so bundled dependencies remain included.
 * - `'list'`: lists files without applying publish-specific exclusions.
 *
 * @since 0.12.0
 */
export function makeYarnClassic(mode: "list" | "publish" | "bundle" = "publish"): Target {
	const ctx = createNpmContext(mode)

	const extractors: Extractor[] = [
		makePackageJsonExtractor(mode),
		{
			extract: extractNoCaseNpmignore,
			path: "./.yarnignore",
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

	cachedYarnClassicAfterExcludesRule ||= ruleCompile(
		{
			compiled: null,
			excludes: true,
			list: [".npmignore", ".gitignore"],
		},
		{ nocase: true },
	)

	cachedYarnClassicExcludesRule ||= ruleCompile(
		{
			compiled: null,
			excludes: true,
			list: [
				// The list of standard ignored patterns defined by Yarn Berry plugin-pack when walking package directories.
				// https://github.com/yarnpkg/berry/blob/57081c05a398f25c92df1dc78752f2053576cec0/packages/plugin-pack/sources/packUtils.ts#L23
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
				".DS_Store",
				"/.npm-extension.mjs",
				"/.npm-extension.cjs",
			],
		},
		{ nocase: true },
	)

	cachedYarnClassicIncludesRule ||= ruleCompile(
		{
			compiled: null,
			excludes: false,
			list: [
				// The list of files that Yarn Berry unconditionally packs (never ignores) such as README and LICENSE.
				// https://github.com/yarnpkg/berry/blob/57081c05a398f25c92df1dc78752f2053576cec0/packages/plugin-pack/sources/packUtils.ts#L9
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

	const internal: InternalRules = {
		after: [cachedYarnClassicAfterExcludesRule],
		before: [
			makeBundledDepsRule(ctx, makeYarnClassic),
			makePackageResolutionRule(ctx),
			symlinkRule,
			makePatchedDepsRule(ctx),
			ctx.npmIgnoreExcludeGlobRule,
			makeDirectPathsRule(ctx.directPathsInclude),
			cachedYarnClassicExcludesRule,
			cachedYarnClassicIncludesRule,
		],
	}

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
