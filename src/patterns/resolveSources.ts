import type { Target } from "../targets/target.js"
import type { FsAdapter } from "../types.js"
import { type PatternFinderOptions, type Extractor, type ExtractorFn } from "./extractor.js"
import type { PatternCompileOptions } from "./patternCompile.js"
import type { Resource } from "./resource.js"
import type { Rule } from "./rule.js"
import type { Source } from "./source.js"

import { dirname, join } from "../unixify.js"
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
}


/**
 * @since 0.6.0
 */
export function resolveSources(
	options: ResolveSourcesOptions,
	cb: (err: Error | null, resource: Resource) => void,
): void {
	const resource = options.resource
	if (resource !== undefined) {
		cb(null, resource)
		return
	}
	const { fs, external, cwd, signal, target } = options
	let dir = options.dir

	let source: Resource | undefined
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
				// if cache is found populate descendants [cwd > ... > dir]
				for (const noSourceDir of noSourceDirList) {
					external.set(noSourceDir, source)
				}
				cb(null, source)
				return
			}
			noSourceDirList.push(dir)
			const parent = dirname(dir)
			if (dir === parent) break
			dir = parent
			continue
		}
	}

	// else
	// find non-cwd source [root > cwd) and populate [cwd > ... > dir]

	const preCwdSegments: string[] = []
	if (target.root.startsWith("/")) {
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
			if (source !== null) {
				for (const noSourceDir of noSourceDirList) {
					external.set(noSourceDir, source)
				}
				cb(null, source)
				return
			}
			const absPaths = noSourceDirList.map((rel) => join(cwd, rel))
			findSourceForAbsoluteDirsCb(absPaths, fs, target, signal, (err, source) => {
				if (err) {
					cb(err, null)
					return
				}
				if (source !== undefined) {
					for (const noSourceDir of noSourceDirList) {
						external.set(noSourceDir, source)
					}
				}
				cb(null, source)
			})
		})
		return
	}

	const absPaths = noSourceDirList.map((rel) => join(cwd, rel))
	findSourceForAbsoluteDirsCb(absPaths, fs, target, signal, (err, source) => {
		if (err) {
			cb(err, null)
			return
		}
		if (source !== undefined) {
			for (const noSourceDir of noSourceDirList) {
				external.set(noSourceDir, source)
			}
		}
		cb(null, source)
	})
}


function findSourceForAbsoluteDirsCb(
	paths: string[],
	fs: FsAdapter,
	target: Target,
	signal: AbortSignal | null,
	cb: (err: Error | null, resource: Resource) => void,
): void {
	if (signal?.aborted) {
		cb(signal.reason, null)
		return
	}
	const flatTasks = paths.flatMap((parent) =>
		target.extractors.map((extractor) => ({ parent, extractor })),
	)

	let i = 0
	function next() {
		if (i >= flatTasks.length) {
			cb(null, null)
			return
		}
		const task = flatTasks[i++]!
		const { parent, extractor } = task
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
	let abs = join(cwd, extractor.path)

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
