import type { Target } from "./target.js"

import {
	type Extractor,
	ruleTest,
	type Rule,
	ruleCompile,
	extractNpmignore,
	type GlobRule,
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
} from "./npmManifest.js"

let cachedBunExcludesRule: GlobRule | null = null
let cachedBunIncludesRule: GlobRule | null = null

/**
 * Creates a Bun target where `mode` controls default rules:
 * - `'publish'`: applies Bun's default exclusions (e.g. `.git`, lockfiles).
 * - `'bundle'`: omits default exclusions so bundled dependencies remain included.
 * - `'list'`: lists files without applying packing exclusions.
 *
 * @since 0.12.0
 */
export function makeBun(mode: "list" | "publish" | "bundle" = "publish"): Target {
	const ctx = createNpmContext(mode)

	const extractors: Extractor[] = [
		makePackageJsonExtractor(mode),
		{
			extract: extractNpmignore,
			path: ".npmignore",
		},
		{
			extract: extractNpmignore,
			path: ".gitignore",
		},
	]

	cachedBunExcludesRule ||= ruleCompile({
		compiled: null,
		excludes: true,
		list: [
			// The list of default ignored file names in the project root used by Bun when packing.
			// https://github.com/oven-sh/bun/blob/bbe3f6a2629adf808adbd0da199ae8c94a3c0d47/src/runtime/cli/pack_command.rs#L352
			"package-lock.json",
			"yarn.lock",
			"pnpm-lock.yaml",
			"bun.lockb",
			"bun.lock", // npm includes it
			"/.npm-extension.mjs",
			"/.npm-extension.cjs",

			// The general list of default ignored file names and glob patterns used by Bun when packing.
			// https://github.com/oven-sh/bun/blob/bbe3f6a2629adf808adbd0da199ae8c94a3c0d47/src/runtime/cli/pack_command.rs#L363
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

			// Excludes package.json from default directory walking since it is handled unconditionally by Bun.
			// https://github.com/oven-sh/bun/blob/bbe3f6a2629adf808adbd0da199ae8c94a3c0d47/src/runtime/cli/pack_command.rs#L1308
			// manifest should be included, but bun ignores it on this line
			// Forces the inclusion of package.json and other files that must always be packed by Bun.
			// https://github.com/oven-sh/bun/blob/bbe3f6a2629adf808adbd0da199ae8c94a3c0d47/src/runtime/cli/pack_command.rs#L1605
			// "package.json",

			// Excludes node_modules from default directory walking when packing.
			// https://github.com/oven-sh/bun/blob/bbe3f6a2629adf808adbd0da199ae8c94a3c0d47/src/runtime/cli/pack_command.rs#L1314
			"node_modules",
		],
	})

	cachedBunIncludesRule ||= ruleCompile(
		{
			compiled: null,
			excludes: false,
			list: [
				// Forces the inclusion of package.json and other files that must always be packed by Bun.
				// https://github.com/oven-sh/bun/blob/bbe3f6a2629adf808adbd0da199ae8c94a3c0d47/src/runtime/cli/pack_command.rs#L1605
				"/package.json",

				// Matches special filenames like LICENSE, LICENCE, README, and their extension variants to unconditionally pack them.
				// https://github.com/oven-sh/bun/blob/bbe3f6a2629adf808adbd0da199ae8c94a3c0d47/src/runtime/cli/pack_command.rs#L3944
				"/LICENSE",
				"/LICENSE.*",
				"/LICENCE",
				"/LICENCE.*",
				"/README",
				"/README.*",
			],
		},
		{ nocase: true },
	)

	const internal: Rule[] = [
		makeBundledDepsRule(ctx, makeBun),
		makePackageResolutionRule(ctx),
		symlinkRule,
		makePatchedDepsRule(ctx),
		ctx.npmIgnoreExcludeGlobRule,
		makeDirectPathsRule(ctx.directPathsInclude),
		cachedBunExcludesRule,
		cachedBunIncludesRule,
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
