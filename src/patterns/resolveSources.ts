import type { Dirent } from "node:fs"

import type { Target } from "../targets/target.js"
import type { FsAdapter } from "../types.js"
import type { PatternCompileOptions } from "./patternCompile.js"
import type { Resource } from "./resource.js"
import type { Rule } from "./rule.js"
import type { Source } from "./source.js"

import { dirname, join } from "../unixify.js"
import { type PatternFinderOptions, type Extractor, type ExtractorFn } from "./extractor.js"
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
	 * "dir" => Source
	 * "dir/subdir" => Source
	 *
	 * @since 0.11.0
	 */
	external: Map<string, Resource>
	/**
	 * Directory entries of the current directory.
	 * Used for optimization to avoid redundant `fs.readFile` calls.
	 *
	 * @since 0.11.1
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
	const { fs, external, cwd, signal, target, resource: parentResource } = options
	let dir = options.dir

	if (target.root === "." && dir !== ".") {
		resolveSources({ ...options, dir: "." }, (err, res) => {
			if (err) return cb(err, null as any)
			external.set(dir, res)
			cb(null, res)
		})
		return
	}
	if (target.root === "." && dir !== ".") {
		resolveSources({ ...options, dir: "." }, (err, res) => {
			if (err) return cb(err, null as any)
			external.set(dir, res)
			cb(null, res)
		})
		return
	}
	let source = external.get(dir)
	if (source !== undefined) {
		cb(null, source)
		return
	}

	const noSourceDirList: string[] = [dir]

	if (dir !== ".") {
		dir = dirname(dir)

		// find source from an ancestor [dir < ... < cwd]
		while (true) {
			if (signal?.aborted) {
				cb(signal.reason, null)
				return
			}
			source = external.get(dir)
			if (source !== undefined) {
				break
			}
			noSourceDirList.push(dir)
			const parent = dirname(dir)
			if (dir === parent) break
			dir = parent
			continue
		}
	}

	// find non-cwd source [root > cwd) and populate [cwd > ... > dir]

	const preCwdSegments: string[] = []
	if (target.root.charCodeAt(0) === 47) {
		// "/"
		let c = dirname(cwd)
		while (true) {
			if (signal?.aborted) {
				cb(signal.reason, null)
				return
			}
			preCwdSegments.push(c)
			if (c === target.root) break
			const parent = dirname(c)
			c = parent
		}
		preCwdSegments.reverse()

		findSourceForAbsoluteDirsCb(preCwdSegments, fs, target, signal, (err, source) => {
			if (err) {
				cb(err, null)
				return
			}

			const absPaths = Array.from<string>({ length: noSourceDirList.length })
			for (let i = 0, len = noSourceDirList.length; i < len; i++) {
				absPaths[i] = join(cwd, noSourceDirList[i]!)
			}
			findSourceForAbsoluteDirsCb(
				absPaths,
				fs,
				target,
				signal,
				(err, s) => {
					if (err) {
						cb(err, null)
						return
					}
					const finalSource = s || source || parentResource || null
					external.set(options.dir, finalSource)
					cb(null, finalSource)
				},
				options.entries,
			)
		})
		return
	}

	const absPaths = Array.from<string>({ length: noSourceDirList.length })
	for (let i = 0, len = noSourceDirList.length; i < len; i++) {
		absPaths[i] = join(cwd, noSourceDirList[i]!)
	}
	findSourceForAbsoluteDirsCb(
		absPaths,
		fs,
		target,
		signal,
		(err, source) => {
			if (err) {
				cb(err, null)
				return
			}
			const finalSource = source || parentResource || null
			external.set(options.dir, finalSource)
			cb(null, finalSource)
		},
		options.entries,
	)
}

function findSourceForAbsoluteDirsCb(
	paths: string[],
	fs: FsAdapter,
	target: Target,
	signal: AbortSignal | null,
	cb: (err: Error | null, resource: Resource) => void,
	entries?: Dirent[],
): void {
	if (signal?.aborted) {
		cb(signal.reason, null)
		return
	}
	const extractors = target.extractors
	const plen = paths.length
	const elen = extractors.length

	let i = 0
	let j = 0
	function next() {
		if (i >= plen) {
			cb(null, null)
			return
		}
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
			const firstSegment = slashIdx === -1 ? epath : epath.substring(0, slashIdx)
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
			if (err) {
				cb(err, null)
				return
			}
			if (source !== null) {
				cb(null, source)
				return
			}
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
			if (error.code === "ENOENT") {
				cb(null, null)
				return
			}
			cb(null, {
				error,
				source: {
					inverted: false,
					path: extractor.path,
					rules: [],
				},
			})
			return
		}

		const newSource = <Source>{
			inverted: false,
			path: extractor.path,
			rules: [],
		}

		const act = (extractor.extract as ExtractorFn)(newSource, buff!)
		if (act === null) {
			cb(null, null)
			return
		}
		if (act instanceof Error) {
			cb(null, { error: act, source: newSource })
			return
		}
		cb(null, newSource)
	})
}
