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

	if (root === "." && dir !== ".") {
		return resolveSources({ ...options, dir: "." }, (err, res) => {
			if (err) return cb(err, null)
			external.set(dir, res)
			cb(null, res)
		})
	}

	const paths: string[] = []
	let current = dir

	while (true) {
		if (signal?.aborted) return cb(signal.reason as Error, null)

		const cached = external.get(current)
		if (cached !== undefined) {
			if (current === dir) return cb(null, cached)
			break
		}

		paths.push(join(cwd, current))
		if (current === "." || current === "/") break
		current = dirname(current)
	}

	if (root.startsWith("/")) {
		let curr = root
		while (curr.length < cwd.length && cwd.startsWith(curr)) {
			if (!external.has(curr)) paths.push(curr)
			const nextSlash = cwd.indexOf("/", curr.length + 1)
			if (nextSlash === -1) break
			curr = cwd.slice(0, nextSlash)
		}
	}

	const elen = extractors.length
	const plen = paths.length

	let pending = plen * elen
	let resolved = false

	const entrySet = entries ? new Set(entries.map((e) => e.name)) : null

	if (pending === 0) {
		const res = resource ?? null
		external.set(dir, res)
		return cb(null, res)
	}

	// oxlint-disable-next-line typescript/no-explicit-any
	const results: any[] = new Array(plen)

	const check = () => {
		if (resolved) return
		for (let i = 0; i < plen; i++) {
			const res = results[i]
			if (res === undefined) break
			if (res !== null) {
				resolved = true
				external.set(dir, res)
				return cb(null, res)
			}
		}
		if (pending === 0 && !resolved) {
			resolved = true
			const res = resource ?? null
			external.set(dir, res)
			return cb(null, res)
		}
	}

	for (let i = 0; i < plen; i++) {
		const parent = paths[i]!
		let pPending = elen
		results[i] = undefined

		for (let j = 0; j < elen; j++) {
			if (resolved) return

			const extractor = extractors[j]!
			const { path: epath, extract } = extractor

			if (entrySet && i === 0) {
				const slashIdx = epath.indexOf("/")
				const firstSegment = slashIdx === -1 ? epath : epath.slice(0, slashIdx)
				if (!entrySet.has(firstSegment)) {
					pending--
					if (--pPending === 0) {
						results[i] = null
						check()
					}
					continue
				}
			}

			fs.readFile(join(parent, epath), (err, buff) => {
				if (resolved) return
				if (signal?.aborted) {
					resolved = true
					return cb(signal.reason as Error, null)
				}

				if (err) {
					pending--
					if (err.code === "ENOENT") {
						if (--pPending === 0) {
							results[i] = null
							check()
						}
						return
					}
					resolved = true
					const res: Resource = {
						error: err,
						source: { inverted: false, path: epath, rules: [] },
					}
					external.set(dir, res)
					return cb(null, res)
				}

				const source: Source = { inverted: false, path: epath, rules: [] }
				const act = extract(source, buff!)

				pending--
				if (act === null) {
					if (--pPending === 0) {
						results[i] = null
						check()
					}
					return
				}

				if (act instanceof Error) {
					resolved = true
					const res: Resource = { error: act, source }
					external.set(dir, res)
					return cb(null, res)
				}

				results[i] = source
				check()
			})
		}
	}
}
