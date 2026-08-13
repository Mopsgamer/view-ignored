import type { Dirent } from "node:fs"

import type { FsAdapter } from "../types.js"
import type { Extractor, ExtractorFn, PatternFinderOptions } from "./extractor.js"
import type { PatternCompileOptions } from "./patternList.js"
import type { Resource } from "./resource.js"
import type { GlobRule } from "./rule.js"
import type { Source } from "./source.js"

import { dirname, join } from "../unixify.js"
import { patternListCompile } from "./patternList.js"

// Cache for resolved extended roots per cwd and extendsRoot field to avoid redundant filesystem lookups
const extendedRootCache = new Map<string, string | null>()

function isParentOf(parent: string, child: string): boolean {
	const pLen = parent.length
	const cLen = child.length
	if (pLen >= cLen) return false
	if (!child.startsWith(parent)) return false
	if (parent.charCodeAt(pLen - 1) === 47) return true // parent ends with '/'
	return child.charCodeAt(pLen) === 47 // child has '/' right after parent
}

function countSlashes(s: string): number {
	let count = 0
	for (let i = 0; i < s.length; i++) {
		if (s.charCodeAt(i) === 47) count++
	}
	return count
}

function getLv(cwd: string, extRoot: string | null): number {
	return extRoot && isParentOf(extRoot, cwd) ? countSlashes(cwd) - countSlashes(extRoot) : 0
}

/**
 * Robustly goes up one directory level for relative paths like ".", "..", "../.."
 */
function getParentDir(p: string): string {
	if (p === "" || p === ".") return ".."
	if (p.startsWith("..")) return p + "/.."
	const lastSlash = p.lastIndexOf("/")
	if (lastSlash === -1) return "."
	if (lastSlash === 0) return "/"
	return p.slice(0, lastSlash)
}

/**
 * Recursively climbs parent directories to find a package.json containing the specified field.
 */
function findExtendedRoot(
	fs: FsAdapter,
	cwd: string,
	extendsRoot: string,
	cb: (err: Error | null, path: string | null) => void,
): void {
	const cacheKey = `${cwd}::${extendsRoot}`
	if (extendedRootCache.has(cacheKey)) return cb(null, extendedRootCache.get(cacheKey)!)

	let current = cwd

	const next = () => {
		const pkgPath = join(current, "package.json")
		fs.readFile(pkgPath, (err, content) => {
			if (!err && content) {
				try {
					const pkg = JSON.parse(content.toString())
					if (pkg && pkg[extendsRoot] !== undefined) {
						extendedRootCache.set(cacheKey, current)
						return cb(null, current)
					}
				} catch {
					// Treat invalid JSON as non-existent field
				}
			}

			const parent = dirname(current)
			if (parent === current || parent === "/" || parent === ".") {
				extendedRootCache.set(cacheKey, null)
				return cb(null, null)
			}
			current = parent
			next()
		})
	}

	next()
}

/**
 * Compiles the {@link Rule} (forced).
 * Can be compiled at any time.
 * Extractors are compiling it.
 *
 * @see {@link patternListCompile}
 *
 * @since 0.6.0
 */
export function ruleCompile(rule: GlobRule, options?: PatternCompileOptions): GlobRule {
	rule.compiled = patternListCompile({ ...options, list: rule.list })
	return rule
}

/**
 * @see {@link resolveSources}
 *
 * @since 0.6.0
 */
export interface ResolveSourcesOptions extends PatternFinderOptions {
	/**
	 * Relative directory path.
	 *
	 * @example
	 * "dir/subdir"
	 *
	 * @since 0.6.0
	 */
	dir: string
	/**
	 * Maps directory paths to their corresponding sources.
	 *
	 * @example
	 * "dir" => Resource
	 * "dir/subdir" => Resource
	 *
	 * @since 0.11.0
	 */
	external: Map<string, Resource>
	/**
	 * Directory entries of the current directory.
	 * Used for optimization to avoid redundant `fs.readFile` calls.
	 *
	 * @since 0.11.0
	 */
	entries?: Dirent[]
}

/**
 * Highly optimized individual extractor runner.
 */
function launchExtractor(
	fs: FsAdapter,
	parent: string,
	epath: string,
	extract: ExtractorFn,
	entries_: Dirent[] | undefined,
	dir: string,
	cb: (err: Error | null, res: Resource) => void,
): void {
	const isDotSlash = epath.startsWith("./")
	if (isDotSlash && dir !== "." && dir !== "") return cb(null, null)

	const cleanPath = isDotSlash ? epath.slice(2) : epath

	if (entries_) {
		const slashIdx = cleanPath.indexOf("/")
		const firstSegment = slashIdx === -1 ? cleanPath : cleanPath.slice(0, slashIdx)
		if (!entries_.some((e) => e.name === firstSegment)) return cb(null, null)
	}

	fs.readFile(join(parent, cleanPath), (err, buff) => {
		// oxlint-disable-next-line typescript/no-explicit-any
		if (err && (err as any).code === "ENOENT") return cb(null, null)

		const source: Source = {
			dir,
			inverted: isDotSlash,
			path: join(dir, cleanPath),
			rules: [],
		}

		if (err) return cb(null, { error: err, source })

		try {
			const act = extract(source, buff!)
			if (act === null) return cb(null, null)
			if (act === undefined) return cb(null, source)
			return cb(null, { error: act as Error, source })
		} catch (act) {
			return cb(null, { error: act as Error, source })
		}
	})
}

/**
 * Parallel runner for all extractors in a single directory level.
 */
function launchDirectoryExtractors(
	fs: FsAdapter,
	parent: string,
	dir: string,
	extractors: Extractor[],
	entries_: Dirent[] | undefined,
	cb: (err: Error | null, results: Resource[]) => void,
): void {
	const elen = extractors.length
	const results = new Array(elen)
	if (elen === 0) return cb(null, results)

	let active = elen
	let hasError = false

	const check = () => {
		if (hasError) return
		active--
		if (active === 0) cb(null, results)
	}

	for (let ei = 0; ei < elen; ei++) {
		const extractor = extractors[ei]!
		launchExtractor(fs, parent, extractor.path, extractor.extract, entries_, dir, (err, res) => {
			if (hasError) return
			if (err) {
				hasError = true
				// oxlint-disable-next-line typescript/no-explicit-any
				return cb(err, null as any)
			}
			results[ei] = res
			check()
		})
	}
}

function resolveSourcesMain(
	options: ResolveSourcesOptions,
	maxLevels: number,
	cb: (err: Error | null, resource: Resource) => void,
): void {
	const { fs, external, cwd, signal, target, resource, dir, entries } = options
	const { root, extractors } = target

	const searchDirs: string[] = []
	const relDirs: string[] = []
	let current = dir
	let baseResource: Resource = resource ?? null

	let currentLevels = 0
	while (true) {
		if (signal?.aborted) return cb(signal.reason as Error, null)

		const cached_ = external.get(current)
		if (cached_ !== undefined) {
			baseResource = cached_
			break
		}

		searchDirs.push(join(cwd, current))
		relDirs.push(current)

		const canGoHigher = !(current === "." || current.startsWith("..")) || currentLevels < maxLevels
		if (!canGoHigher) break
		current = getParentDir(current)
		if (current.startsWith("..")) currentLevels++
	}

	if (root.startsWith("/")) {
		let curr = root
		while (curr.length < cwd.length && cwd.startsWith(curr)) {
			if (!external.has(curr)) {
				searchDirs.push(curr)
				relDirs.push(curr)
			}
			const nextSlash = cwd.indexOf("/", curr.length + 1)
			if (nextSlash === -1) break
			curr = cwd.slice(0, nextSlash)
		}
	}

	const elen = extractors.length
	const plen = searchDirs.length
	const results = new Array(plen * elen)
	let activeDirs = plen
	let resolved = false

	const checkAll = () => {
		if (resolved) return
		if (signal?.aborted) {
			resolved = true
			return cb(signal.reason as Error, null)
		}
		activeDirs--
		if (activeDirs > 0) return
		resolved = true

		const defaultParentResource: Resource =
			baseResource && !("error" in baseResource) ? baseResource : null

		// Link sources of the same extractor across parent directories
		for (let ei = 0; ei < elen; ei++) {
			let lastExtractorResource: Resource = defaultParentResource
			for (let pi = plen - 1; pi >= 0; pi--) {
				const res = results[pi * elen + ei]
				if (!res) continue
				if (!("error" in res)) res.parent = lastExtractorResource
				lastExtractorResource = res
			}
		}

		let lastResource: Resource = baseResource

		for (let pi = plen - 1; pi >= 0; pi--) {
			let dirResource: Resource = null
			for (let ei = 0; ei < elen; ei++) {
				const res = results[pi * elen + ei]
				if (res && res !== null) {
					dirResource = res
					break
				}
			}

			if (!dirResource) dirResource = lastResource

			external.set(relDirs[pi]!, dirResource)
			lastResource = dirResource
		}

		cb(null, lastResource)
	}

	for (let pi = 0; pi < plen; pi++) {
		const parent = searchDirs[pi]!
		const relDir = relDirs[pi]!

		const runWithEntries = (dirEntries?: Dirent[]) => {
			launchDirectoryExtractors(fs, parent, relDir, extractors, dirEntries, (err, dirResults) => {
				if (resolved) return
				if (err) {
					resolved = true
					return cb(err, null)
				}
				for (let ei = 0; ei < elen; ei++) {
					results[pi * elen + ei] = dirResults[ei]
				}
				checkAll()
			})
		}

		runWithEntries(pi === 0 ? entries : undefined)
	}

	if (plen === 0) checkAll()
}

/**
 * @since 0.6.0
 */
export function resolveSources(
	options: ResolveSourcesOptions,
	cb: (err: Error | null, resource: Resource) => void,
): void {
	const cached = options.external.get(options.dir)
	if (cached !== undefined) return cb(null, cached)

	const { fs, cwd, target } = options

	if (!target.extendsRoot) {
		resolveSourcesMain(options, 0, cb)
		return
	}

	const cacheKey = `${cwd}::${target.extendsRoot}`
	const cachedExtRoot = extendedRootCache.get(cacheKey)
	if (cachedExtRoot !== undefined) {
		resolveSourcesMain(options, getLv(cwd, cachedExtRoot), cb)
		return
	}

	findExtendedRoot(fs, cwd, target.extendsRoot, (err, extRoot) => {
		if (err) {
			cb(err, null)
			return
		}
		resolveSourcesMain(options, getLv(cwd, extRoot), cb)
	})
}
