import type { Stats } from "node:fs"

import type {
	CustomRule,
	GlobRule,
	IgnoresOptions,
	MatcherContext,
	SkipRule,
} from "../patterns/index.js"
import type { Source } from "../patterns/source.js"
import type { FsAdapter } from "../types.js"
import type { Target } from "./target.js"

import glob from "picomatch"

import { extractNpmignore } from "../patterns/npmignore.js"
import { ruleCompile } from "../patterns/resolveSources.js"
import { scan } from "../scan.js"
import { isWhitespace, trimLeadingDotSlash, join, dirname } from "../unixify.js"

export function extractNoCaseNpmignore(source: Source, content: Uint8Array): void | null | Error {
	return extractNpmignore(source, content, { nocase: true })
}

export const symlinkRule = {
	excludes: true,
	match({ dirent }) {
		return dirent.isSymbolicLink() ? "//symlink" : null
	},
} satisfies CustomRule as CustomRule

export function makeDirectPathsRule(directPathsInclude: Record<string, string>): CustomRule {
	return {
		excludes: false,
		match({ entry }) {
			for (const [manifestProp, path] of Object.entries(directPathsInclude)) {
				if (entry === path) return "//'" + manifestProp + "' property is " + path
			}
			return null
		},
	} satisfies CustomRule as CustomRule
}

export interface PackageJson {
	name: string
	version: string
	private?: boolean
	engines?: Record<string, string>
	scripts?: Record<string, string>
	bin?: string | Record<string, string>
	browser?: string
	dependencies?: Record<string, string>
	devDependencies?: Record<string, string>
	files?: string[]
	main?: string
	module?: string
	optionalDependencies?: Record<string, string>
	bundleDependencies?: boolean | string[]
	bundledDependencies?: boolean | string[]
	patchedDependencies?: Record<string, string>
	workspaces?: string[] | { packages?: string[] }
}

function hasUppercase(s: string): boolean {
	const len = s.length
	for (let i = 0; i < len; i++) {
		const c = s.charCodeAt(i)
		if (c >= 65 && c <= 90) return true
	}
	return false
}

function isValidNpmName(name: string): boolean {
	const len = name.length
	if (
		len === 0 ||
		len > 214 ||
		isWhitespace(name.charCodeAt(0)) ||
		isWhitespace(name.charCodeAt(len - 1))
	) {
		return false
	}
	if (name.startsWith("@")) {
		const parts = name.slice(1).split("/")
		if (parts.length !== 2 || parts[0] === "" || parts[1] === "") {
			return false
		}
		return isValidNameComponent(parts[0]!) && isValidNameComponent(parts[1]!)
	}
	return isValidNameComponent(name)
}

function isValidNameComponent(part: string): boolean {
	if (part.startsWith(".") || part.startsWith("_") || hasUppercase(part)) {
		return false
	}
	if (/[~!'()* ]/.test(part)) {
		return false
	}
	try {
		return encodeURIComponent(part) === part
	} catch {
		return false
	}
}

function isRecordOfStrings(value: unknown): value is Record<string, string> {
	if (!value || typeof value !== "object" || Array.isArray(value)) {
		return false
	}
	return Object.values(value).every((v) => typeof v === "string")
}

export function isArrayOfStrings(value: unknown): value is string[] {
	return Array.isArray(value) && value.every((v) => typeof v === "string")
}

const SEMVER_REGEX =
	/^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\.(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?(?:\+([0-9a-zA-Z-]+(?:\.[0-9a-zA-Z-]+)*))?$/

export function npmManifestParse(
	s: string,
	mode: "list" | "publish" | "bundle" | "vsce" = "publish",
): PackageJson {
	// oxlint-disable-next-line typescript/no-explicit-any
	let parsed: any
	try {
		parsed = JSON.parse(s)
	} catch (err) {
		if (mode === "list" || mode === "bundle") return {} as PackageJson
		throw err
	}

	if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
		if (mode === "list" || mode === "bundle") return {} as PackageJson
		throw new Error("npm manifest must be a JSON object")
	}

	if ("private" in parsed && typeof parsed.private !== "boolean") {
		if (mode === "list" || mode === "bundle") return {} as PackageJson
		throw new Error("'private' field must be a boolean")
	}

	if (!parsed.private) {
		if (typeof parsed.name !== "string") {
			if (mode === "list" || mode === "bundle") return {} as PackageJson
			throw new Error("Manifest must have a non-empty string 'name'")
		}
		if (typeof parsed.version !== "string") {
			if (mode === "list" || mode === "bundle") return {} as PackageJson
			throw new Error("Manifest must have a non-empty string 'version'")
		}
		if (mode === "vsce") {
			if (!/^[a-z0-9][a-z0-9-]*$/i.test(parsed.name))
				throw new Error(`Invalid extension "name": "${parsed.name}" in package.json`)
		} else if (!isValidNpmName(parsed.name)) {
			if (mode === "list" || mode === "bundle") return {} as PackageJson
			throw new Error(`'${parsed.name}' is not a valid npm package name`)
		}

		// Strict SemVer verification
		if (!SEMVER_REGEX.test(parsed.version)) {
			if (mode === "list" || mode === "bundle") return {} as PackageJson
			throw new Error(`'${parsed.version}' is not a valid SemVer version (expected format: X.Y.Z)`)
		}
	}

	if ("bundleDependencies" in parsed && "bundledDependencies" in parsed) {
		if (mode === "list" || mode === "bundle") return {} as PackageJson
		throw new Error("Manifest cannot contain both 'bundleDependencies' and 'bundledDependencies'")
	}

	const stringFields: (keyof PackageJson)[] = ["browser", "main", "module"]
	for (const field of stringFields) {
		if (field in parsed && typeof parsed[field] !== "string") {
			if (mode === "list" || mode === "bundle") return {} as PackageJson
			throw new Error(`'${field}' field must be a string`)
		}
	}

	if (parsed.engines !== undefined && !isRecordOfStrings(parsed.engines)) {
		if (mode === "list" || mode === "bundle") return {} as PackageJson
		throw new Error("'engines' field must be an object with string values")
	}
	if (parsed.scripts !== undefined && !isRecordOfStrings(parsed.scripts)) {
		if (mode === "list" || mode === "bundle") return {} as PackageJson
		throw new Error("'scripts' field must be an object with string values")
	}
	if (parsed.dependencies !== undefined && !isRecordOfStrings(parsed.dependencies)) {
		if (mode === "list" || mode === "bundle") return {} as PackageJson
		throw new Error("'dependencies' field must be an object with string values")
	}
	if (parsed.devDependencies !== undefined && !isRecordOfStrings(parsed.devDependencies)) {
		if (mode === "list" || mode === "bundle") return {} as PackageJson
		throw new Error("'devDependencies' field must be an object with string values")
	}
	if (
		parsed.optionalDependencies !== undefined &&
		!isRecordOfStrings(parsed.optionalDependencies)
	) {
		if (mode === "list" || mode === "bundle") return {} as PackageJson
		throw new Error("'optionalDependencies' field must be an object with string values")
	}

	if ("files" in parsed && !isArrayOfStrings(parsed.files)) {
		if (mode === "list" || mode === "bundle") return {} as PackageJson
		throw new Error("'files' field must be an array of strings")
	}

	const bundleFields: (keyof PackageJson)[] = ["bundleDependencies", "bundledDependencies"]
	for (const field of bundleFields) {
		if (field in parsed && typeof parsed[field] !== "boolean" && !isArrayOfStrings(parsed[field])) {
			if (mode === "list" || mode === "bundle") return {} as PackageJson
			throw new Error(`'${field}' field must be a boolean or an array of strings`)
		}
	}

	if ("bin" in parsed) {
		const binValue = parsed.bin
		const isValidBin = typeof binValue === "string" || isRecordOfStrings(binValue)
		if (!isValidBin) {
			if (mode === "list" || mode === "bundle") return {} as PackageJson
			throw new Error("'bin' field must be a string or an object with string values")
		}
	}

	return parsed as PackageJson
}

/**
 * Extracts and normalizes direct paths (main, module, browser, and bin fields)
 * to be included in target package file scans, cleaning leading `./` and `/`,
 * stripping trailing slashes, and ignoring invalid parent-escaping paths (e.g., `../`).
 *
 * @since 0.12.0
 */
export function extractManifestIncludes(manifest: PackageJson, dist: Record<string, string>): void {
	addDirectPath(manifest.main, dist, "main")
	addDirectPath(manifest.module, dist, "module")
	addDirectPath(manifest.browser, dist, "browser")

	if (typeof manifest.bin === "string") addDirectPath(manifest.bin, dist, "bin")
	else if (typeof manifest.bin === "object" && manifest.bin !== null) {
		Object.entries(manifest.bin).forEach(([key, binPath]) => {
			addDirectPath(binPath, dist, "bin." + key)
		})
	}
}

function addDirectPath(p: string | undefined, dist: Record<string, string>, key: string) {
	if (typeof p !== "string") return
	const normalized = trimLeadingDotSlash(p)
	if (normalized && !normalized.startsWith("../") && normalized !== "..") dist[key] = normalized
}

export function findDependencyPackageJson(
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
		if (segment !== "node_modules")
			candidates.push(current + "/node_modules/" + depName + "/package.json")
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

export function resolveBundledDeps(
	cwd: string,
	fs: FsAdapter,
	manifest: PackageJson,
	cb: (err: Error | null, bundledDeps: string[]) => void,
): void {
	const bundleDepsField =
		manifest.bundleDependencies !== undefined
			? manifest.bundleDependencies
			: manifest.bundledDependencies
	let initialBundledDeps: string[] = []
	if (bundleDepsField === true) {
		if (manifest.dependencies) {
			for (const dep in manifest.dependencies) {
				initialBundledDeps.push(dep)
			}
		}
		if (manifest.optionalDependencies) {
			for (const dep in manifest.optionalDependencies) {
				initialBundledDeps.push(dep)
			}
		}
	} else if (Array.isArray(bundleDepsField)) {
		const deps = manifest.dependencies
		const optDeps = manifest.optionalDependencies
		for (let i = 0; i < bundleDepsField.length; i++) {
			const dep = bundleDepsField[i]!
			if ((deps && deps[dep] !== undefined) || (optDeps && optDeps[dep] !== undefined)) {
				initialBundledDeps.push(dep)
			}
		}
	}

	let pendingInitial = initialBundledDeps.length
	if (pendingInitial === 0) {
		cb(null, [])
		return
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

		findDependencyPackageJson(cwd, fs, importerRelPath, depName, (content, foundRelPath) => {
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
				if (pending === 0) done()
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

	for (const dep of initialBundledDeps) {
		resolveTransitive(".", dep, () => {
			pendingInitial--
			if (pendingInitial === 0) {
				cb(null, Array.from(resolvedBundledDeps))
			}
		})
	}
}

export interface NpmContext {
	bundledDeps: string[]
	directPathsInclude: Record<string, string>
	dist?: PackageJson
	explicitRootFiles: Set<string>
	mode: "list" | "publish" | "bundle"
	npmIgnoreExcludeGlobRule: GlobRule
	patchedDepsExclude: Set<string>
	rootDeps: Set<string>
	whitelistedPaths: Set<string>
	whitelistedRegex: RegExp | null
	workspaceRegex: RegExp | null
}

export function createNpmContext(mode: "list" | "publish" | "bundle" = "publish"): NpmContext {
	return {
		bundledDeps: [],
		directPathsInclude: Object.create(null),
		dist: undefined,
		explicitRootFiles: new Set<string>(),
		mode,
		npmIgnoreExcludeGlobRule: ruleCompile(
			{
				compiled: null,
				excludes: true,
				list: [],
			},
			{ nocase: true },
		),
		patchedDepsExclude: new Set<string>(),
		rootDeps: new Set<string>(),
		whitelistedPaths: new Set<string>(),
		whitelistedRegex: null,
		workspaceRegex: null,
	}
}

export function isWhitelistedByFiles(ctx: NpmContext, entry: string): boolean {
	if (!ctx.dist || !ctx.dist.files) return false
	if (ctx.whitelistedPaths.has(entry)) return true
	return ctx.whitelistedRegex !== null && ctx.whitelistedRegex.test(entry)
}

export function makePatchedDepsRule(ctx: NpmContext): CustomRule {
	return {
		excludes: true,
		match({ entry }) {
			if (ctx.patchedDepsExclude.has(entry)) return "//patchedDependencies exclusion"
			return null
		},
	} satisfies CustomRule as CustomRule
}

export function makePackageResolutionRule(ctx: NpmContext): SkipRule {
	return (options: IgnoresOptions) => {
		const { entry } = options
		if (!entry || entry === "." || !options.dirent.isDirectory()) return null

		if (isWhitelistedByFiles(ctx, entry)) return null

		const isWorkspace = ctx.workspaceRegex !== null && ctx.workspaceRegex.test(entry)
		if (!isWorkspace && ctx.rootDeps.size === 0) return null

		const pkgPath = join(options.cwd, entry + "/package.json")
		return new Promise<MatcherContext | null>((resolve) => {
			options.fs.readFile(pkgPath, (err, content) => {
				if (err || !content) {
					resolve(null)
					return
				}
				try {
					const pkg = JSON.parse(content.toString())
					if (
						pkg &&
						(isWorkspace || (typeof pkg.name === "string" && ctx.rootDeps.has(pkg.name)))
					) {
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
				resolve(null)
			})
		})
	}
}

export function makeBundledDepsRule(
	ctx: NpmContext,
	makeTarget: (mode: "list" | "publish" | "bundle") => Target,
): SkipRule {
	return (options: IgnoresOptions) => {
		const { entry } = options
		if (entry !== join(options.within || "", "node_modules")) return null

		const remainingDepth = (options.depth ?? Infinity) - 2

		if (remainingDepth < 0 || ctx.bundledDeps.length === 0) {
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

		const promises = ctx.bundledDeps.map((dep) => {
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
						target: makeTarget("bundle"),
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
}

export function initNpmContext(
	ctx: NpmContext,
	options: { fs: FsAdapter; cwd: string },
	cb: (err: Error | null) => void,
): void {
	const { fs, cwd } = options
	ctx.dist = undefined
	ctx.rootDeps.clear()
	ctx.whitelistedPaths.clear()
	ctx.whitelistedRegex = null
	ctx.workspaceRegex = null
	ctx.bundledDeps = []
	ctx.explicitRootFiles.clear()
	ctx.patchedDepsExclude.clear()
	ctx.npmIgnoreExcludeGlobRule.list = []
	for (const key in ctx.directPathsInclude) {
		delete ctx.directPathsInclude[key]
	}

	fs.readFile(cwd + "/package.json", (err, content) => {
		if (err) {
			if (ctx.mode !== "publish") return cb(null)
			if (err.code === "ENOENT") {
				cb(new Error("'package.json' not found", { cause: err }))
				return
			}
			cb(new Error("Error while initializing NPM-based target", { cause: err }))
			return
		}

		let parsedDist: PackageJson
		try {
			parsedDist = npmManifestParse(content!.toString(), ctx.mode)
			ctx.dist = parsedDist
		} catch (error) {
			cb(new Error("Invalid 'package.json'", { cause: error }))
			return
		}

		const depFields = ["dependencies", "devDependencies", "optionalDependencies"] as const
		for (let i = 0; i < depFields.length; i++) {
			const deps = parsedDist[depFields[i]!]
			if (deps) {
				for (const dep in deps) ctx.rootDeps.add(dep)
			}
		}

		if (parsedDist.files) {
			const reSources: string[] = []
			for (let i = 0; i < parsedDist.files.length; i++) {
				const file = parsedDist.files[i]!
				const normalized = trimLeadingDotSlash(file)
				ctx.whitelistedPaths.add(normalized)

				let parent = dirname(normalized)
				while (parent && parent !== "." && parent !== "/") {
					ctx.whitelistedPaths.add(parent)
					parent = dirname(parent)
				}

				try {
					reSources.push(glob.makeRe(normalized, { dot: true, nocase: true }).source)
				} catch {
					// ignore invalid globs
				}
			}
			if (reSources.length > 0) {
				ctx.whitelistedRegex = new RegExp(reSources.join("|"), "i")
			}
		}

		extractManifestIncludes(parsedDist, ctx.directPathsInclude)

		if (parsedDist.files) {
			const list: string[] = []
			for (let i = 0; i < parsedDist.files.length; i++) {
				const file = parsedDist.files[i]!
				const normalized = trimLeadingDotSlash(file)
				if (!normalized.includes("/")) {
					ctx.explicitRootFiles.add(normalized)
				}
			}

			// Whitelist Mode: exclude ignore files in 'before' to prevent
			// nested ones from leaking if parent directory is whitelisted.
			list.push("/*/**/.npmignore", "/*/**/.gitignore")
			if (!ctx.explicitRootFiles.has(".npmignore")) list.push(".npmignore")
			if (!ctx.explicitRootFiles.has(".gitignore")) list.push(".gitignore")

			ctx.npmIgnoreExcludeGlobRule.list = list
			ruleCompile(ctx.npmIgnoreExcludeGlobRule, { nocase: true })
		}

		if (parsedDist.patchedDependencies && ctx.mode === "publish") {
			for (const patchPath of Object.values(parsedDist.patchedDependencies)) {
				if (typeof patchPath !== "string") continue
				const normalized = trimLeadingDotSlash(patchPath)
				if (!normalized || normalized.startsWith("../") || normalized === "..") continue
				ctx.patchedDepsExclude.add(normalized)
			}
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
					ctx.workspaceRegex = new RegExp(reSources.join("|"), "i")
				}
			}

			cb(null)
		}

		resolveBundledDeps(cwd, fs, parsedDist, (_, resolved) => {
			ctx.bundledDeps = resolved || []
			afterInit()
		})
	})
}
