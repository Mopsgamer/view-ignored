import type { Stats } from "node:fs"

import type { FsAdapter } from "../types.js"
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
import { join, dirname, trimLeadingDotSlash } from "../unixify.js"
import {
	npmManifestParse,
	type PackageJson,
	extractManifestIncludes,
	symlinkRule,
	makeDirectPathsRule,
} from "./npmManifest.js"

function findDependencyPackageJson(
	cwd: string,
	fs: FsAdapter,
	importerRelPath: string,
	depName: string,
	resolveCb: (content: string | null, foundRelPath: string | null) => void,
) {
	const candidates: string[] = []
	let current = importerRelPath
	while (current && current !== "." && current !== "/") {
		const idx = current.lastIndexOf("/")
		const segment = idx === -1 ? current : current.slice(idx + 1)
		if (segment !== "node_modules") {
			candidates.push(current + "/node_modules/" + depName + "/package.json")
		}
		if (idx === -1) break
		current = current.slice(0, idx)
	}
	candidates.push("node_modules/" + depName + "/package.json")

	let idx = 0
	const tryNext = () => {
		if (idx >= candidates.length) {
			resolveCb(null, null)
			return
		}
		const cand = candidates[idx]!
		idx++
		const absPath = join(cwd, cand)
		fs.readFile(absPath, (err, fileContent) => {
			if (!err && fileContent) {
				resolveCb(fileContent.toString(), cand)
			} else {
				tryNext()
			}
		})
	}
	tryNext()
}

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
	let dist: PackageJson | undefined
	const rootDeps = new Set<string>()
	const whitelistedPaths = new Set<string>()
	let whitelistedRegex: RegExp | null = null
	let workspaceRegex: RegExp | null = null
	let bundledDeps: string[] = []

	const isWhitelistedByFiles = (entry: string): boolean => {
		if (!dist || !dist.files) return false
		if (whitelistedPaths.has(entry)) return true
		return whitelistedRegex !== null && whitelistedRegex.test(entry)
	}

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

	const packageResolutionRule = (options: IgnoresOptions) => {
		const entry = options.entry
		if (!entry || entry === "." || !options.dirent.isDirectory()) return null

		if (isWhitelistedByFiles(entry)) return null

		const isWorkspace = workspaceRegex !== null && workspaceRegex.test(entry)
		if (!isWorkspace && rootDeps.size === 0) return null

		const pkgPath = join(options.cwd, entry + "/package.json")
		return new Promise<MatcherContext | null>((resolve) => {
			options.fs.readFile(pkgPath, (err, content) => {
				if (!err && content) {
					try {
						const pkg = JSON.parse(content.toString())
						if (pkg && (isWorkspace || (typeof pkg.name === "string" && rootDeps.has(pkg.name)))) {
							resolve({
								external: new Map(),
								failed: [],
								paths: new Map(),
								total: new Map(),
							})
							return
						}
					} catch {
						// ignore parse error
					}
				}
				resolve(null)
			})
		})
	}

	const internal: InternalRules = {
		after: [cachedNpmAfterExcludesRule],
		before: [
			bundledDepsRule,
			packageResolutionRule,
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
		init(options, cb) {
			const fs = options.fs
			const cwd = options.cwd
			dist = undefined
			rootDeps.clear()
			whitelistedPaths.clear()
			whitelistedRegex = null
			workspaceRegex = null
			bundledDeps = []
			explicitRootFiles.clear()
			patchedDepsExclude.clear()
			npmIgnoreExcludeGlobRule.list = []
			for (const key in directPathsInclude) {
				delete directPathsInclude[key]
			}

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

				let parsedDist: PackageJson
				try {
					parsedDist = npmManifestParse(content!.toString(), mode)
					dist = parsedDist
				} catch (error) {
					cb(new Error("Invalid 'package.json'", { cause: error }))
					return
				}

				if (parsedDist.dependencies) {
					for (const dep in parsedDist.dependencies) {
						rootDeps.add(dep)
					}
				}
				if (parsedDist.devDependencies) {
					for (const dep in parsedDist.devDependencies) {
						rootDeps.add(dep)
					}
				}
				if (parsedDist.optionalDependencies) {
					for (const dep in parsedDist.optionalDependencies) {
						rootDeps.add(dep)
					}
				}

				if (parsedDist.files) {
					const reSources: string[] = []
					for (let i = 0; i < parsedDist.files.length; i++) {
						const file = parsedDist.files[i]!
						const normalized = trimLeadingDotSlash(file)
						whitelistedPaths.add(normalized)

						let parent = dirname(normalized)
						while (parent && parent !== "." && parent !== "/") {
							whitelistedPaths.add(parent)
							parent = dirname(parent)
						}

						try {
							reSources.push(glob.makeRe(normalized, { dot: true, nocase: true }).source)
						} catch {
							// ignore invalid globs
						}
					}
					if (reSources.length > 0) {
						whitelistedRegex = new RegExp(reSources.join("|"), "i")
					}
				}

				extractManifestIncludes(parsedDist, directPathsInclude)

				if (parsedDist.files) {
					const list: string[] = []
					for (let i = 0; i < parsedDist.files.length; i++) {
						const file = parsedDist.files[i]!
						const normalized = trimLeadingDotSlash(file)
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

				if (parsedDist.patchedDependencies && mode === "publish") {
					for (const patchPath of Object.values(parsedDist.patchedDependencies)) {
						if (typeof patchPath !== "string") continue
						const normalized = trimLeadingDotSlash(patchPath)
						if (!normalized || normalized.startsWith("../") || normalized === "..") continue
						patchedDepsExclude.add(normalized)
					}
				}

				const getDepPackageJson = (
					importerRelPath: string,
					depName: string,
					resolveCb: (content: string | null, foundRelPath: string | null) => void,
				) => {
					findDependencyPackageJson(cwd, fs, importerRelPath, depName, resolveCb)
				}

				const bundleDepsField =
					parsedDist.bundleDependencies !== undefined
						? parsedDist.bundleDependencies
						: parsedDist.bundledDependencies
				let initialBundledDeps: string[] = []
				if (bundleDepsField === true) {
					if (parsedDist.dependencies) {
						for (const dep in parsedDist.dependencies) {
							initialBundledDeps.push(dep)
						}
					}
					if (parsedDist.optionalDependencies) {
						for (const dep in parsedDist.optionalDependencies) {
							initialBundledDeps.push(dep)
						}
					}
				} else if (Array.isArray(bundleDepsField)) {
					const deps = parsedDist.dependencies
					const optDeps = parsedDist.optionalDependencies
					for (let i = 0; i < bundleDepsField.length; i++) {
						const dep = bundleDepsField[i]!
						if ((deps && deps[dep] !== undefined) || (optDeps && optDeps[dep] !== undefined)) {
							initialBundledDeps.push(dep)
						}
					}
				}

				const resolvedBundledDeps = new Set<string>()
				const visited = new Set<string>()

				const resolveTransitive = (importerRelPath: string, depName: string, done: () => void) => {
					resolvedBundledDeps.add(depName)
					const visitKey = importerRelPath + "::" + depName
					if (visited.has(visitKey)) {
						done()
						return
					}
					visited.add(visitKey)

					getDepPackageJson(importerRelPath, depName, (content, foundRelPath) => {
						if (!content || !foundRelPath) {
							done()
							return
						}

						let pkg: PackageJson
						try {
							pkg = JSON.parse(content)
						} catch {
							done()
							return
						}

						let pending = 0
						const deps = pkg.dependencies
						const optDeps = pkg.optionalDependencies
						if (deps) {
							for (const _ in deps) {
								pending++
							}
						}
						if (optDeps) {
							for (const _ in optDeps) {
								pending++
							}
						}

						if (pending === 0) {
							done()
							return
						}

						const subDir = dirname(foundRelPath)
						const onSubDone = () => {
							pending--
							if (pending === 0) {
								done()
							}
						}
						if (deps) {
							for (const subDep in deps) {
								resolveTransitive(subDir, subDep, onSubDone)
							}
						}
						if (optDeps) {
							for (const subDep in optDeps) {
								resolveTransitive(subDir, subDep, onSubDone)
							}
						}
					})
				}

				const afterInit = () => {
					let workspacePatterns: string[] = []
					if (parsedDist.workspaces) {
						if (Array.isArray(parsedDist.workspaces)) {
							workspacePatterns = parsedDist.workspaces
						} else if (
							parsedDist.workspaces.packages &&
							Array.isArray(parsedDist.workspaces.packages)
						) {
							workspacePatterns = parsedDist.workspaces.packages
						}
					}
					if (workspacePatterns.length > 0) {
						const reSources: string[] = []
						for (let i = 0; i < workspacePatterns.length; i++) {
							const pattern = workspacePatterns[i]!
							let cleaned = pattern
							if (cleaned.startsWith("./")) cleaned = cleaned.slice(2)
							if (cleaned.endsWith("/")) cleaned = cleaned.slice(0, -1)
							try {
								reSources.push(glob.makeRe(cleaned, { nocase: true }).source)
							} catch {
								// ignore invalid globs
							}
						}
						if (reSources.length > 0) {
							workspaceRegex = new RegExp(reSources.join("|"), "i")
						}
					}

					cb(null)
				}

				let pendingInitial = initialBundledDeps.length
				if (pendingInitial === 0) {
					bundledDeps = []
					afterInit()
					return
				}

				for (const dep of initialBundledDeps) {
					resolveTransitive(".", dep, () => {
						pendingInitial--
						if (pendingInitial === 0) {
							bundledDeps = Array.from(resolvedBundledDeps)
							afterInit()
						}
					})
				}
			})
		},
		internalRules: internal,
		root: ".",
	}
}
