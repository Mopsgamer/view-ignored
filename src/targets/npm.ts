import type { Stats } from "node:fs"

import type { Target } from "./target.js"

import glob from "picomatch"

import {
	type Extractor,
	ruleTest,
	ruleCompile,
	extractNpmignore,
	packageJsonExtractor,
	type InternalRules,
	type GlobRule,
	type IgnoresOptions,
	type MatcherContext,
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

	let bundledDeps: string[] = []

	const bundledDepsRule = (options: IgnoresOptions) => {
		const entry = options.entry
		if (entry !== "node_modules" && !entry.endsWith("/node_modules")) return null

		const remainingDepth = (options.depth ?? Infinity) - 2

		if (remainingDepth < 0 || bundledDeps.length === 0) {
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
			const depPath = entry + "/" + dep
			const absDepPath = join(options.cwd, depPath)
			return new Promise<void>((resolve) => {
				options.fs.stat(absDepPath, (_, stats?: Stats) => {
					if (!stats || !stats.isDirectory()) {
						resolve()
						return
					}
					scan({
						cwd: absDepPath,
						depth: remainingDepth,
						dirs: false,
						fs: options.fs,
						target: makeNPM(),
					}).then(
						(subCtx) => {
							if (subCtx.paths) {
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

	let workspaceRules: RegExp[] = []

	const subPackageRule = (options: IgnoresOptions) => {
		const entry = options.entry
		if (!entry || entry === "." || !options.dirent.isDirectory()) return null

		const isWorkspace = workspaceRules.some((re) => re.test(entry))
		if (!isWorkspace) return null

		const pkgPath = join(options.cwd, entry + "/package.json")
		return new Promise<MatcherContext | null>((resolve) => {
			options.fs.stat(pkgPath, (err, stats?: Stats) => {
				if (!err && stats && stats.isFile()) {
					resolve({
						external: new Map(),
						failed: [],
						paths: new Map(),
						total: new Map(),
					})
				} else {
					resolve(null)
				}
			})
		})
	}

	const internal: InternalRules = {
		after: [cachedNpmAfterExcludesRule],
		before: [
			bundledDepsRule,
			subPackageRule,
			symlinkRule,
			makeDirectPathsRule(directPathsInclude),
			cachedNpmBeforeExcludesRule,
			cachedNpmBeforeIncludesRule,
		],
	}

	return <Target>{
		extendsRoot: "workspaces",
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
				}
				if (Array.isArray(bundleDepsField)) {
					bundledDeps = bundleDepsField.filter(
						(dep) =>
							(dist.dependencies && Object.hasOwn(dist.dependencies, dep)) ||
							(dist.optionalDependencies && Object.hasOwn(dist.optionalDependencies, dep)),
					)
				}

				let workspacePatterns: string[] = []
				if (dist.workspaces) {
					if (Array.isArray(dist.workspaces)) {
						workspacePatterns = dist.workspaces
					} else if (dist.workspaces.packages && Array.isArray(dist.workspaces.packages)) {
						workspacePatterns = dist.workspaces.packages
					}
				}
				workspaceRules = workspacePatterns.map((pattern) => {
					let cleaned = pattern
					if (cleaned.startsWith("./")) cleaned = cleaned.slice(2)
					if (cleaned.endsWith("/")) cleaned = cleaned.slice(0, -1)
					return glob.makeRe(cleaned, { nocase: true })
				})

				cb(null)
			})
		},
		internalRules: internal,
		root: ".",
	}
}
