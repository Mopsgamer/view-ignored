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
			if (!err) external.set(dir, res)
			cb(err, res)
		})
	}

	const searchDirs: string[] = []
	const relDirs: string[] = []
	let curr = dir

	while (true) {
		// oxlint-disable-next-line typescript/no-explicit-any
		if (signal?.aborted) return cb(signal.reason as Error, null as any)
		if (external.has(curr)) break
		searchDirs.push(join(cwd, curr))
		relDirs.push(curr)
		if (curr === "." || curr === "/") break
		curr = dirname(curr)
	}

	if (root.startsWith("/")) {
		let c = root
		while (c.length < cwd.length && cwd.startsWith(c)) {
			if (!external.has(c)) {
				searchDirs.push(c)
				relDirs.push(c)
			}
			const next = cwd.indexOf("/", c.length + 1)
			if (next === -1) break
			c = cwd.slice(0, next)
		}
	}

	const plen = searchDirs.length
	const elen = extractors.length
	if (!plen) return cb(null, (resource ?? null) as Resource)

	let called = false
	let nextPi = 0
	const states = new Array(plen)
	const done = (err: Error | null, res: Resource) => {
		if (called) return
		called = true
		cb(err, res)
	}

	const check = () => {
		if (called) return
		while (nextPi < plen) {
			const s = states[nextPi]
			if (!s?.ready) return
			for (let j = 0; j < elen; j++) {
				const r = s.results[j]
				if (r === undefined) return
				if (r !== null) {
					for (let k = 0; k <= nextPi; k++) external.set(relDirs[k]!, r as Resource)
					return done(null, r as Resource)
				}
			}
			nextPi++
		}
		const res = (resource ?? null) as Resource
		for (const d of relDirs) external.set(d, res)
		done(null, res)
	}

	const segs = extractors.map((e) => e.path.split("/", 1)[0]!)

	searchDirs.forEach((path, i) => {
		const s = (states[i] = { ready: false, results: new Array(elen) })
		const onEnts = (ents: Dirent[] | null) => {
			// oxlint-disable-next-line typescript/no-explicit-any
			if (signal?.aborted) return done(signal.reason as Error, null as any)
			s.ready = true
			let p = 0
			const set = ents && ents.length > 32 ? new Set(ents.map((e) => e.name)) : null
			for (let j = 0; j < elen; j++) {
				const { path: ep, extract } = extractors[j]!
				if (ents && (set ? !set.has(segs[j]!) : !ents.some((e) => e.name === segs[j]))) {
					s.results[j] = null
					continue
				}
				p++
				fs.readFile(join(path, ep), (err, buff) => {
					if (called) return
					// oxlint-disable-next-line typescript/no-explicit-any
					if (signal?.aborted) return done(signal.reason as Error, null as any)
					const src: Source = { inverted: false, path: ep, rules: [] }
					let r: Resource = null
					if (!err) {
						const act = extract(src, buff!)
						if (act !== null) r = act instanceof Error ? { error: act, source: src } : src
					} else if (err.code !== "ENOENT") {
						r = { error: err, source: src }
					}
					s.results[j] = r
					check()
				})
			}
			if (!p) check()
		}
		if (i === 0 && entries) onEnts(entries)
		else fs.readdir(path, { withFileTypes: true }, (_, res) => onEnts(res || null))
	})
}
