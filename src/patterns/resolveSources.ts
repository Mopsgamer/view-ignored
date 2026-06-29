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
	rule.compiled = patternListCompile({ ...options, context: rule.pattern })
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
	let baseResource: Resource = resource ?? null

	while (true) {
		if (signal?.aborted) return cb(signal.reason as Error, null)

		const cached = external.get(current)
		if (cached !== undefined) {
			baseResource = cached
			break
		}

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
	const results = new Array(plen * elen)
	let activeTasks = 0
	let resolved = false

	const check = (): void => {
		if (resolved) return
		if (signal?.aborted) {
			resolved = true
			return cb(signal.reason as Error, null)
		}

		for (let i = 0, len = results.length; i < len; i++) {
			const res = results[i]
			if (res === undefined) return
			if (res === null) continue
			resolved = true
			const pi = (i / elen) | 0
			for (let j = 0; j <= pi; j++) {
				const d = relDirs[j]
				if (d !== undefined) external.set(d, res)
			}
			return cb(null, res)
		}

		if (activeTasks > 0) return
		resolved = true
		for (let i = 0; i < plen; i++) {
			external.set(relDirs[i]!, baseResource)
		}
		cb(null, baseResource)
	}

	for (let pi = 0; pi < plen; pi++) {
		const parent = searchDirs[pi]!

		const launch = (entries_?: Dirent[]): void => {
			if (resolved) return
			let directoryTasks = elen
			for (let ei = 0; ei < elen; ei++) {
				const extractor = extractors[ei]!
				const { path: epath, extract } = extractor
				if (entries_) {
					const slashIdx = epath.indexOf("/")
					const firstSegment = slashIdx === -1 ? epath : epath.slice(0, slashIdx)
					let found = false
					for (let k = 0, len = entries_.length; k < len; k++) {
						if (entries_[k]!.name === firstSegment) {
							found = true
							break
						}
					}
					if (!found) {
						results[pi * elen + ei] = null
						directoryTasks--
						continue
					}
				}
				activeTasks++
				fs.readFile(join(parent, epath), (err, buff) => {
					activeTasks--
					if (resolved) return
					const ri = pi * elen + ei
					if (err) {
						// oxlint-disable-next-line typescript/no-explicit-any
						if ((err as any).code === "ENOENT") {
							results[ri] = null
							check()
							return
						}
						results[ri] = {
							error: err,
							source: { inverted: false, path: epath, rules: [] },
						}
						check()
						return
					}
					const source: Source = { inverted: false, path: epath, rules: [] }
					let act: void | null | Error
					try {
						act = extract(source, buff!)
					} catch (act) {
						results[ri] = { error: act, source }
						check()
						return
					}
					if (act === null) results[ri] = null
					else if (act === undefined) results[ri] = source
					else results[ri] = { error: act, source }
					check()
				})
			}
			if (directoryTasks === 0) check()
		}
		if (pi === 0 && entries) {
			launch(entries)
			continue
		}
		activeTasks++
		fs.readdir(parent, { withFileTypes: true }, (err, entries_) => {
			activeTasks--
			if (!err) {
				launch(entries_ as Dirent[])
				return
			}
			for (let ei = 0; ei < elen; ei++) {
				const ri = pi * elen + ei
				// oxlint-disable-next-line typescript/no-explicit-any
				if ((err as any).code === "ENOENT") {
					results[ri] = null
					continue
				}
				const extractor = extractors[ei]!
				results[ri] = {
					error: err,
					source: { inverted: false, path: extractor.path, rules: [] },
				}
			}
			check()
			return
		})
	}

	if (plen === 0) check()
}
