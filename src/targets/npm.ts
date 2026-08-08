import type { Stats } from "node:fs"

import type { Target } from "./target.js"

import glob from "picomatch"

import {
	type Extractor,
	ruleTest,
	ruleCompile,
	extractNpmignore,
	type InternalRules,
	type GlobRule,
	type IgnoresOptions,
	type MatcherContext,
	type CustomRule,
} from "../patterns/index.js"
import { makePackageJsonExtractor } from "../patterns/packagejson.js"
import { scan } from "../scan.js"
import { join, unixify } from "../unixify.js"
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
export function makeNPM(mode: "list" | "publish" | "bundle" = "publish"): Target {
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

	const directPathsInclude: Record<string, string> = Object.create(null)

	const patchedDepsExclude = new Set<string>()

	const patchedDepsRule = {
		excludes: true,
		match({ entry }) {
			if (patchedDepsExclude.has(entry)) {
				return "//patchedDependencies exclusion"
			}
			return null
		},
	} satisfies CustomRule as CustomRule

	const explicitRootFiles = new Set<string>()

	const npmIgnoreExcludeGlobRule: GlobRule = {
		compiled: null,
		excludes: true,
		list: [],
	}
	ruleCompile(npmIgnoreExcludeGlobRule, { nocase: true })

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
				"/bun.lock",
				"/.npm-extension.mjs",
				"/.npm-extension.cjs",
				"*~",

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
		if (entry !== join(options.within || "", "node_modules")) return null

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
						target: makeNPM("bundle"),
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
			patchedDepsRule,
			npmIgnoreExcludeGlobRule,
			makeDirectPathsRule(directPathsInclude),
			...(mode === "bundle" ? [] : [cachedNpmBeforeExcludesRule]),
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
					if (mode !== "publish") return cb(null)
					if (err.code === "ENOENT") {
						cb(new Error("'package.json' not found", { cause: err }))
						return
					}
					cb(new Error("Error while initializing NPM", { cause: err }))
					return
				}

				let dist: PackageJson
				try {
					dist = npmManifestParse(content!.toString(), mode)
				} catch (error) {
					cb(new Error("Invalid 'package.json'", { cause: error }))
					return
				}

				extractManifestIncludes(dist, directPathsInclude)

				if (dist.files) {
					const list: string[] = []
					for (const file of dist.files) {
						let normalized = unixify(file)
						while (normalized.startsWith("./") || normalized.startsWith("/")) {
							normalized = normalized.startsWith("./") ? normalized.slice(2) : normalized.slice(1)
						}
						if (!normalized.includes("/")) {
							explicitRootFiles.add(normalized)
						}
					}

					// Whitelist Mode: exclude ignore files in 'before' to prevent
					// nested ones from leaking if parent directory is whitelisted.
					list.push("/*/**/.npmignore", "/*/**/.gitignore")
					if (!explicitRootFiles.has(".npmignore")) list.push(".npmignore")
					if (!explicitRootFiles.has(".gitignore")) list.push(".gitignore")

					npmIgnoreExcludeGlobRule.list = list
					ruleCompile(npmIgnoreExcludeGlobRule, { nocase: true })
				}

				if (dist.patchedDependencies && mode === "publish") {
					for (const patchPath of Object.values(dist.patchedDependencies)) {
						if (typeof patchPath !== "string") continue
						let normalized = unixify(patchPath)
						while (normalized.startsWith("./") || normalized.startsWith("/")) {
							normalized = normalized.startsWith("./") ? normalized.slice(2) : normalized.slice(1)
						}
						if (!normalized || normalized.startsWith("../") || normalized === "..") continue
						patchedDepsExclude.add(normalized)
					}
				}

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
