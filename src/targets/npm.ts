import type { Target } from "./target.js"

import {
	type Extractor,
	ruleTest,
	ruleCompile,
	extractNpmignore,
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
	makeNodeModulesIgnoreRule,
} from "./npmManifest.js"

const cachedNpmAfterExcludesRule = ruleCompile(
	{
		compiled: null,
		excludes: true,
		list: [".npmignore", ".gitignore"],
	},
	{ nocase: true },
)

const cachedNpmBeforeExcludesRule = ruleCompile(
	{
		compiled: null,
		excludes: true,
		list: [
			".git",
			".svn",
			".hg",
			"CVS",
			"/.lock-wscript",
			"/.wafpickle-*",
			"/build/config.gypi",
			"npm-debug.log",
			".npmrc",
			".*.swp",
			".DS_Store",
			"._*",
			"*.orig",
			"/archived-packages/**",

			"/node_modules",
			"/package-lock.json",
			"/yarn.lock",
			"/pnpm-lock.yaml",
			"/bun.lockb",
			"/bun.lock",
			"/.npm-extension.mjs",
			"/.npm-extension.cjs",
			"*~",

			"*\\**",
		],
	},
	{ nocase: true },
)

const cachedNpmBeforeIncludesRule = ruleCompile(
	{
		compiled: null,
		excludes: false,
		list: [
			"/package.json",
			"/README",
			"/COPYING",
			"/LICENSE",
			"/LICENCE",
			"/README.*",
			"/COPYING.*",
			"/LICENSE.*",
			"/LICENCE.*",
		],
	},
	{ nocase: true },
)

/**
 * @since 0.12.0
 */
export function makeNPM(mode: "list" | "publish" | "bundle" = "publish"): Target {
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

	const internal: InternalRules = {
		after: [cachedNpmAfterExcludesRule],
		before: [
			makeNodeModulesIgnoreRule(ctx),
			makeBundledDepsRule(ctx, makeNPM),
			makePackageResolutionRule(ctx),
			symlinkRule,
			makePatchedDepsRule(ctx),
			ctx.npmIgnoreExcludeGlobRule,
			makeDirectPathsRule(ctx.directPathsInclude),
			...(mode === "bundle" ? [] : [cachedNpmBeforeExcludesRule]),
			cachedNpmBeforeIncludesRule,
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
