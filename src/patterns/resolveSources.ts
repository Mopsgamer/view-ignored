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
	let current = dir

	while (true) {
		// oxlint-disable-next-line typescript/no-explicit-any
		if (signal?.aborted) return cb(signal.reason as Error, null as any)
		if (external.has(current)) break

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

	const plen = searchDirs.length
	const elen = extractors.length
	if (plen === 0) return cb(null, (resource ?? null) as Resource)

	const results = new Array(plen * elen)
	const ready = new Uint8Array(plen)
	let called = false
	let nextPi = 0

	const done = (err: Error | null, res: Resource) => {
		if (called) return
		called = true
		cb(err, res)
	}

	const check = () => {
		if (called) return
		while (nextPi < plen && ready[nextPi]) {
			const base = nextPi * elen
			for (let j = 0; j < elen; j++) {
				const r = results[base + j]
				if (r === undefined) return
				if (r !== null) {
					const final = r instanceof Error || (r && "error" in r) ? r : (r as Source)
					for (let k = 0; k <= nextPi; k++) external.set(relDirs[k]!, final as Resource)
					return done(null, final as Resource)
				}
			}
			nextPi++
		}
		if (nextPi === plen) {
			const res = (resource ?? null) as Resource
			for (let i = 0; i < plen; i++) external.set(relDirs[i]!, res)
			done(null, res)
		}
	}

	const segs = extractors.map((e) => e.path.split("/", 1)[0]!)

	for (let i = 0; i < plen; i++) {
		const path = searchDirs[i]!
		const base = i * elen
		const onEnts = (ents: Dirent[] | null) => {
			// oxlint-disable-next-line typescript/no-explicit-any
			if (signal?.aborted) return done(signal.reason as Error, null as any)
			ready[i] = 1
			let pending = 0
			const set = ents && ents.length > 32 ? new Set(ents.map((e) => e.name)) : null

			for (let j = 0; j < elen; j++) {
				const seg = segs[j]!
				if (ents && (set ? !set.has(seg) : !ents.some((e) => e.name === seg))) {
					results[base + j] = null
					continue
				}
				pending++
				const { path: ep, extract } = extractors[j]!
				fs.readFile(join(path, ep), (err, buff) => {
					if (called || (signal && signal.aborted)) return
					let r: Resource = null
					if (!err) {
						const src: Source = { inverted: false, path: ep, rules: [] }
						const act = extract(src, buff!)
						r = act === null ? null : act instanceof Error ? { error: act, source: src } : src
					} else if (err.code !== "ENOENT") {
						r = { error: err, source: { inverted: false, path: ep, rules: [] } }
					}
					results[base + j] = r
					check()
				})
			}
			if (pending === 0) check()
		}

		if (i === 0 && entries) {
			onEnts(entries)
		} else {
			fs.readdir(path, { withFileTypes: true }, (_, res) => onEnts(res || null))
		}
	}
}
