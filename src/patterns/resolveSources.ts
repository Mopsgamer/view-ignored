import type { Dirent } from "node:fs"

import type { Target } from "../targets/target.js"
import type { FsAdapter } from "../types.js"
import type { Extractor, PatternFinderOptions } from "./extractor.js"
import type { Resource } from "./resource.js"
import type { Rule } from "./rule.js"
import type { Source } from "./source.js"

import { join } from "../unixify.js"
import { patternListCompile } from "./patternCompile.js"
import { MatchMode } from "./patternMode.js"

/**
 * Compiles the {@link Rule} (forced).
 * Can be compiled at any time.
 * Extractors are compiling it.
 *
 * @see {@link patternListCompile}
 *
 * @since 0.6.0
 */
export function ruleCompile(rule: Rule, mode: MatchMode = MatchMode.normal): Rule {
	rule.compiled = patternListCompile(rule.pattern, mode)

	const literals = new Set<string>()
	let hasComplex = false

	for (let i = 0, len = rule.compiled.length; i < len; i++) {
		const r = rule.compiled[i]!
		if (r._isLiteral && !r._matchBase && !r._isRoot) {
			literals.add(r._simplePattern)
		} else {
			hasComplex = true
		}
	}

	if (literals.size > 0 && !hasComplex) {
		rule._literals = literals
	} else {
		delete rule._literals
	}

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
 * @since 0.6.0
 */
export function resolveSources(
	options: ResolveSourcesOptions,
	cb: (err: Error | null, resource: Resource) => void,
): void {
	const { dir, external, target } = options

	if (target.root === "." && dir !== ".") {
		return resolveSourcesForRootTarget(options, cb)
	}

	let source = external.get(dir)
	if (source !== undefined) return cb(null, source)

	const noSourceDirList: string[] = [dir]
	let currentDir = dir
	while (currentDir !== ".") {
		const lastSlash = currentDir.lastIndexOf("/")
		currentDir = lastSlash === -1 ? "." : currentDir.slice(0, lastSlash)
		source = external.get(currentDir)
		if (source !== undefined) break
		noSourceDirList.push(currentDir)
	}

	if (target.root.charCodeAt(0) === 47) {
		return resolveSourcesAbsolute(options, noSourceDirList, cb)
	}

	resolveSourcesRelative(options, noSourceDirList, cb)
}

function resolveSourcesForRootTarget(
	options: ResolveSourcesOptions,
	cb: (err: Error | null, resource: Resource) => void,
): void {
	const { dir, external } = options
	const res = external.get(".")
	if (res !== undefined) {
		external.set(dir, res)
		return cb(null, res)
	}
	resolveSources({ ...options, dir: "." }, (err, res) => {
		if (err) return cb(err, null as any)
		external.set(dir, res)
		cb(null, res)
	})
}

function resolveSourcesAbsolute(
	options: ResolveSourcesOptions,
	noSourceDirList: string[],
	cb: (err: Error | null, resource: Resource) => void,
): void {
	const { fs, target, cwd, signal, external, resource: parentResource } = options
	const segments = cwd.split("/")
	const preCwdSegments: string[] = []
	let current = ""

	for (let i = 0, len = segments.length - 1; i < len; i++) {
		current += segments[i] + "/"
		const path = current.length > 1 ? current.slice(0, -1) : "/"
		if (path.length >= target.root.length) {
			preCwdSegments.push(path)
		}
	}

	findSourceForPaths(preCwdSegments, fs, target, signal, (err, source) => {
		if (err) return cb(err, null)

		const absPaths: string[] = Array.from({ length: noSourceDirList.length })
		for (let i = 0, len = noSourceDirList.length; i < len; i++) {
			absPaths[i] = join(cwd, noSourceDirList[i]!)
		}
		findSourceForPaths(
			absPaths,
			fs,
			target,
			signal,
			(err, s) => {
				if (err) return cb(err, null)
				const finalSource = s || source || parentResource || null
				external.set(options.dir, finalSource)
				cb(null, finalSource)
			},
			options.entries,
		)
	})
}

function resolveSourcesRelative(
	options: ResolveSourcesOptions,
	noSourceDirList: string[],
	cb: (err: Error | null, resource: Resource) => void,
): void {
	const { fs, target, cwd, signal, external, resource: parentResource } = options
	const absPaths: string[] = Array.from({ length: noSourceDirList.length })
	for (let i = 0, len = noSourceDirList.length; i < len; i++) {
		absPaths[i] = join(cwd, noSourceDirList[i]!)
	}
	findSourceForPaths(
		absPaths,
		fs,
		target,
		signal,
		(err, source) => {
			if (err) return cb(err, null)
			const finalSource = source || parentResource || null
			external.set(options.dir, finalSource)
			cb(null, finalSource)
		},
		options.entries,
	)
}

function findSourceForPaths(
	paths: string[],
	fs: FsAdapter,
	target: Target,
	signal: AbortSignal | null,
	cb: (err: Error | null, resource: Resource) => void,
	entries?: Dirent[],
): void {
	const extractors = target.extractors
	const plen = paths.length
	const elen = extractors.length

	let i = 0
	let j = 0
	function next() {
		if (i >= plen) return cb(null, null)
		if (signal?.aborted) return cb(signal.reason, null)

		const parent = paths[i]!
		const extractor = extractors[j]!

		j++
		if (j >= elen) {
			i++
			j = 0
		}

		if (entries && plen > 0 && parent === paths[0]) {
			const epath = extractor.path
			const slashIdx = epath.indexOf("/")
			const firstSegment = slashIdx === -1 ? epath : epath.slice(0, slashIdx)
			let found = false
			for (let k = 0, len = entries.length; k < len; k++) {
				if (entries[k]!.name === firstSegment) {
					found = true
					break
				}
			}
			if (!found) {
				next()
				return
			}
		}

		tryExtractorCb(parent, fs, extractor, (err, source) => {
			if (err) return cb(err, null)
			if (source !== null) return cb(null, source)
			next()
		})
	}
	next()
}

function tryExtractorCb(
	cwd: string,
	fs: FsAdapter,
	extractor: Extractor,
	cb: (err: Error | null, resource: Resource) => void,
): void {
	const abs = join(cwd, extractor.path)

	fs.readFile(abs, (err, buff) => {
		if (err) {
			const error = err as NodeJS.ErrnoException
			if (error.code === "ENOENT") return cb(null, null)
			return cb(null, {
				error,
				source: { inverted: false, path: extractor.path, rules: [] },
			})
		}

		const newSource = <Source>{ inverted: false, path: extractor.path, rules: [] }
		const act = extractor.extract(newSource, buff!)

		if (act === null) return cb(null, null)
		if (act instanceof Error) return cb(null, { error: act, source: newSource })

		cb(null, newSource)
	})
}
