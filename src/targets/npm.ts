import type { Stats } from "node:fs"

import type { Target } from "./target.js"

import {
	type Extractor,
	ruleTest,
	ruleCompile,
	extractNpmignore,
	packageJsonExtractor,
	type InternalRules,
	type GlobRule,
	type IgnoresOptions,
} from "../patterns/index.js"
import { scan } from "../scan.js"
import { join } from "../unixify.js"
import {
	npmManifestParse,
	type PackageJson,
	extractManifestIncludes,
	symlinkRule,
	makeDirectPathsRule,
} from "./npmManifest.js"

let cachedNpmAfterExcludesRule: GlobRule | null = null
let cachedNpmBeforeExcludesRule: GlobRule | null = null
let cachedNpmBeforeIncludesRule: GlobRule | null = null

/**
 * @since 0.12.0
 */
export function makeNPM(): Target {
	const extractors: Extractor[] = [
		packageJsonExtractor,
		{
			extract: extractNpmignore,
			path: ".npmignore",
		},
		{
			extract: extractNpmignore,
			path: ".gitignore",
		},
	]

	const directPathsInclude: Record<string, string> = Object.create(null)

	cachedNpmAfterExcludesRule ||= ruleCompile(
		{
			compiled: null,
			excludes: true,
			list: [".npmignore", ".gitignore"],
		},
		{ nocase: true },
	)

	cachedNpmBeforeExcludesRule ||= ruleCompile(
		{
			compiled: null,
			excludes: true,
			list: [
				// The list of default ignored file names and patterns used by npm-packlist when walking package directories.
				// https://github.com/npm/npm-packlist/blob/d1eed617b1ff1eedf5909efec7867aee385d0350/lib/index.js#L17
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

				// The list of strictly ignored files and patterns (e.g. node_modules, lockfiles) forced by npm-packlist.
				// https://github.com/npm/npm-packlist/blob/d1eed617b1ff1eedf5909efec7867aee385d0350/lib/index.js#L321
				"/node_modules",
				"/package-lock.json",
				"/yarn.lock",
				"/pnpm-lock.yaml",
				"/bun.lockb",

				// npm-packlist ignores files with stars when publishing
				"*\\**",
			],
		},
		{ nocase: true },
	)

	cachedNpmBeforeIncludesRule ||= ruleCompile(
		{
			compiled: null,
			excludes: false,
			list: [
				// The list of files that are unconditionally included in npm packages (e.g. README, LICENSE) forced by npm-packlist.
				// https://github.com/npm/npm-packlist/blob/d1eed617b1ff1eedf5909efec7867aee385d0350/lib/index.js#L315
				"/package.json",
				"README",
				"COPYING",
				"LICENSE",
				"LICENCE",
				"README.*",
				"COPYING.*",
				"LICENSE.*",
				"LICENCE.*",
			],
		},
		{ nocase: true },
	)

	let bundledDeps: string[] = []

	const bundledDepsRule = (options: IgnoresOptions) => {
		if (options.entry !== "node_modules") return null

		if (bundledDeps.length === 0) {
			return {
				external: new Map(),
				failed: [],
				paths: new Map(),
				total: new Map(),
			}
		}

		const mergedCtx = {
			external: new Map(),
			failed: [],
			paths: new Map(),
			total: new Map(),
		}

		const promises = bundledDeps.map((dep) => {
			const depPath = "node_modules/" + dep
			const absDepPath = join(options.cwd, depPath)
			return new Promise<void>((resolve) => {
				options.fs.stat(absDepPath, (_, stats?: Stats) => {
					if (!stats?.isDirectory()) {
						resolve()
						return
					}
					scan({
						cwd: absDepPath,
						dirs: false,
						fs: options.fs,
						target: makeNPM(),
					}).then(
						(subCtx) => {
							if (subCtx?.paths) {
								for (const [p, m] of subCtx.paths) {
									mergedCtx.paths.set(depPath + "/" + p, m)
								}
							}
							resolve()
						},
						() => resolve(),
					)
				})
			})
		})

		return Promise.all(promises).then(() => mergedCtx)
	}

	const internal: InternalRules = {
		after: [cachedNpmAfterExcludesRule],
		before: [
			bundledDepsRule,
			symlinkRule,
			makeDirectPathsRule(directPathsInclude),
			cachedNpmBeforeExcludesRule,
			cachedNpmBeforeIncludesRule,
		],
	}

	return <Target>{
		extractors,
		ignores: ruleTest,
		init({ fs, cwd }, cb) {
			fs.readFile(cwd + "/package.json", (err, content) => {
				if (err) {
					if (err.code === "ENOENT") {
						cb(new Error("'package.json' not found", { cause: err }))
						return
					}
					cb(new Error("Error while initializing NPM", { cause: err }))
					return
				}

				let dist: PackageJson
				try {
					dist = npmManifestParse(content!.toString())
				} catch (error) {
					cb(new Error("Invalid 'package.json'", { cause: error }))
					return
				}

				extractManifestIncludes(dist, directPathsInclude)

				const bundleDepsField = dist.bundleDependencies ?? dist.bundledDependencies
				if (bundleDepsField === true) {
					const depsKeys = dist.dependencies ? Object.keys(dist.dependencies) : []
					const optDepsKeys = dist.optionalDependencies
						? Object.keys(dist.optionalDependencies)
						: []
					bundledDeps = [...depsKeys, ...optDepsKeys]
				} else if (Array.isArray(bundleDepsField)) {
					bundledDeps = bundleDepsField.filter(
						(dep) =>
							(dist.dependencies && Object.hasOwn(dist.dependencies, dep)) ||
							(dist.optionalDependencies && Object.hasOwn(dist.optionalDependencies, dep)),
					)
				}

				cb(null)
			})
		},
		internalRules: internal,
		root: ".",
	}
}
