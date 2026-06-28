import type { Dirent } from "node:fs"

import type { PatternCompileOptions } from "./patternCompile.js"
import type { Resource } from "./resource.js"
import type { Rule } from "./rule.js"
import type { Source } from "./source.js"

import { dirname, join } from "../unixify.js"
import { type PatternFinderOptions } from "./extractor.js"
import { patternListCompile } from "./patternList.js"

/**
 * Compiles the {@link Rule} (forced).
 * Can be compiled at any time.
 * Extractors are compiling it.
 *
 * @see {@link patternListCompile}
 *
 * @since 0.6.0
 */
export function ruleCompile(rule: Rule, options?: PatternCompileOptions): Rule {
	rule.compiled = patternListCompile(rule.pattern, options)
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
	const { fs, external, cwd, signal, target, resource, dir, entries } = options
	const { root, extractors } = target

	const cached = external.get(dir)
	if (cached !== undefined) return cb(null, cached)

	if (root === "." && dir !== ".") {
		return resolveSources({ ...options, dir: "." }, (err, res) => {
			if (err) return cb(err, null)
			external.set(dir, res)
			cb(null, res)
		})
	}

	const searchDirs: string[] = []
	const relDirs: string[] = []
	let current = dir

	while (true) {
		if (signal?.aborted) return cb(signal.reason as Error, null)

		const cached = external.get(current)
		if (cached !== undefined) break

		searchDirs.push(join(cwd, current))
		relDirs.push(current)
		if (current === "." || current === "/") break
		current = dirname(current)
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
	let pi = 0
	let ei = 0

	function next(): void {
		if (signal?.aborted) return cb(signal.reason as Error, null)

		if (pi >= plen) {
			const res = resource ?? null
			for (let i = 0; i < plen; i++) {
				external.set(relDirs[i]!, res)
			}
			return cb(null, res)
		}

		const parent = searchDirs[pi]!
		const extractor = extractors[ei]!
		const { path: epath, extract } = extractor

		if (++ei >= elen) {
			pi++
			ei = 0
		}

		if (entries && pi === 0) {
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

		fs.readFile(join(parent, epath), (err, buff) => {
			if (err) {
				if (err.code === "ENOENT") return next()
				const res: Resource = {
					error: err,
					source: { inverted: false, path: epath, rules: [] },
				}
				for (let i = 0; i <= pi; i++) {
					external.set(relDirs[i]!, res)
				}
				return cb(null, res)
			}

			const source: Source = { inverted: false, path: epath, rules: [] }
			const act = extract(source, buff!)

			if (act === null) return next()
			if (act instanceof Error) {
				const res: Resource = { error: act, source }
				for (let i = 0; i <= pi; i++) {
					external.set(relDirs[i]!, res)
				}
				return cb(null, res)
			}

			for (let i = 0; i <= pi; i++) {
				const d = relDirs[i]
				if (d !== undefined) external.set(d, source)
			}
			cb(null, source)
		})
	}

	next()
}
