import { dirname } from "node:path"

import type { Target } from "../targets/target.js"
import type { FsAdapter } from "../types.js"
import type { PatternFinderOptions, Extractor } from "./extractor.js"
import type { MatcherContext } from "./matcherContext.js"
import type { PatternCompileOptions } from "./patternCompile.js"
import type { Rule } from "./rule.js"
import type { Source } from "./source.js"

import { join, base } from "../unixify.js"
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
export function ruleCompile(signedPattern: Rule, options?: PatternCompileOptions): Rule {
	signedPattern.compiled = patternListCompile(signedPattern.pattern, options)
	return signedPattern
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
}

/**
 * Populates the {@link MatcherContext.external} map with {@link Source} objects.
 *
 * @since 0.6.0
 */
export function resolveSources(options: ResolveSourcesOptions): Promise<void> {
	const { fs, ctx, cwd, signal, target } = options
	let dir = options.dir

	if (ctx.external.has(dir)) {
		return Promise.resolve()
	}

	let source: Source | "none" | undefined
	const noSourceDirList: string[] = [dir]

	if (dir !== ".") {
		dir = dirname(dir)

		// find source from an ancestor [dir < ... < cwd]
		while (true) {
			if (signal?.aborted) return Promise.resolve()
			source = ctx.external.get(dir)
			if (source !== undefined) {
				// if cache is found populate descendants [cwd > ... > dir]
				for (const noSourceDir of noSourceDirList) {
					ctx.external.set(noSourceDir, source)
				}
				return Promise.resolve()
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
			if (signal?.aborted) break
			preCwdSegments.push(c)
			if (c === target.root) break
			const parent = dirname(c)
			c = parent
		}
		preCwdSegments.reverse()

		return findSourceForAbsoluteDirs(preCwdSegments, ctx, fs, target, signal).then((source) => {
			if (typeof source === "object") {
				for (const noSourceDir of noSourceDirList) {
					ctx.external.set(noSourceDir, source)
				}
				return
			}

			const absPaths = noSourceDirList.map((rel) => join(cwd, rel))
			return findSourceForAbsoluteDirs(absPaths, ctx, fs, target, signal).then((source) => {
				for (const noSourceDir of noSourceDirList) {
					ctx.external.set(noSourceDir, source as any)
				}
			})
		})
	}

	const absPaths = noSourceDirList.map((rel) => join(cwd, rel))
	return findSourceForAbsoluteDirs(absPaths, ctx, fs, target, signal).then((source) => {
		for (const noSourceDir of noSourceDirList) {
			ctx.external.set(noSourceDir, source as any)
		}
	})
}

function findSourceForAbsoluteDirs(
	paths: string[],
	ctx: MatcherContext,
	fs: FsAdapter,
	target: Target,
	signal: AbortSignal | null,
): Promise<Source | "none"> {
	let i = 0
	function next(): Promise<Source | "none"> {
		if (i >= paths.length || signal?.aborted) {
			return Promise.resolve("none")
		}
		const parent = paths[i++] as string
		let j = 0
		function nextExtractor(): Promise<Source | "none"> {
			if (j >= target.extractors.length || signal?.aborted) {
				return next()
			}
			const extractor = target.extractors[j++] as Extractor
			return tryExtractor(parent, fs, ctx, extractor).then((s) => {
				if (typeof s === "object" && s.error) {
					ctx.failed.push(s)
					return s
				}
				if (typeof s === "object") {
					return s
				}
				return nextExtractor()
			})
		}
		return nextExtractor()
	}
	return next()
}

function tryExtractor(
	cwd: string,
	fs: FsAdapter,
	ctx: MatcherContext,
	extractor: Extractor,
): Promise<Source | "none"> {
	let abs = join(cwd, extractor.path)
	const name = base(extractor.path)

	const newSource: Source = {
		name,
		path: extractor.path,
		inverted: false,
		pattern: [],
	}

	return fs.promises
		.readFile(abs)
		.then((buff) => {
			try {
				const act = extractor.extract(newSource, buff, ctx)
				if (act === "none") {
					return act
				}
			} catch (err) {
				if (err === "none") {
					return err
				}
				newSource.error =
					err instanceof Error
						? err
						: new Error("Unknown error during source extraction", { cause: err })
				return newSource
			}
			return newSource
		})
		.catch((err) => {
			const error = err as NodeJS.ErrnoException
			if (error.code === "ENOENT") {
				return "none"
			}
			newSource.error = error
			return newSource
		})
}
