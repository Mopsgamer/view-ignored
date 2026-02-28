import { dirname } from "node:path"

import type { Target } from "../targets/target.js"
import type { FsAdapter } from "../types.js"
import type { PatternFinderOptions, Extractor } from "./extractor.js"
import type { MatcherContext } from "./matcherContext.js"
import type { SignedPattern } from "./signedPattern.js"
import type { Source } from "./source.js"
import type { StringCompileOptions } from "./stringCompile.js"

import { unixify, relative, join } from "../unixify.js"
import { patternCompile } from "./pattern.js"

/**
 * Compiles the {@link SignedPattern} (forced).
 * Can be compiled at any time.
 * Extractors are compiling it.
 *
 * @see {@link patternCompile}
 *
 * @since 0.6.0
 */
export function signedPatternCompile(
	signedPattern: SignedPattern,
	options?: StringCompileOptions,
): SignedPattern {
	signedPattern.compiled = patternCompile(signedPattern.pattern, options)
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
export async function resolveSources(options: ResolveSourcesOptions): Promise<void> {
	const { fs, ctx, cwd, target, root, signal } = options
	let dir = options.dir

	if (ctx.external.has(dir)) {
		return
	}

	let source: Source | "none" | undefined
	const noSourceDirList: string[] = [dir]

	if (dir !== ".") {
		dir = dirname(dir)

		// find source from an ancestor [dir < ... < cwd]
		while (true) {
			signal?.throwIfAborted()
			source = ctx.external.get(dir)
			if (source !== undefined) {
				// if cache is found populate descendants [cwd > ... > dir]
				for (const noSourceDir of noSourceDirList) {
					ctx.external.set(noSourceDir, source)
				}
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
	if (root.startsWith("/")) {
		let c = dirname(cwd)
		while (true) {
			signal?.throwIfAborted()
			preCwdSegments.push(c)
			if (c === root) break
			const parent = dirname(c)
			c = parent
		}
		preCwdSegments.reverse()

		source = await findSourceForAbsoluteDirs(preCwdSegments, ctx, fs, target, signal)
		if (typeof source === "object") {
			for (const noSourceDir of noSourceDirList) {
				signal?.throwIfAborted()
				ctx.external.set(noSourceDir, source)
			}
			return
		}
	}

	const absPaths = noSourceDirList.map((rel) => join(cwd, rel))
	source = await findSourceForAbsoluteDirs(absPaths, ctx, fs, target, signal)
	if (source !== undefined) {
		for (const noSourceDir of noSourceDirList) {
			signal?.throwIfAborted()
			ctx.external.set(noSourceDir, source)
		}
	}
}

async function findSourceForAbsoluteDirs(
	paths: string[],
	ctx: MatcherContext,
	fs: FsAdapter,
	target: Target,
	signal: AbortSignal | null,
): Promise<Source | "none"> {
	for (const parent of paths) {
		for (const extractor of target.extractors) {
			signal?.throwIfAborted()
			const s = await tryExtractor(parent, fs, ctx, extractor)
			if (typeof s === "object" && s.error) {
				ctx.failed.push(s)
				return s
			}
			if (typeof s === "object") {
				return s
			}
		}
	}
	return "none"
}

async function tryExtractor(
	cwd: string,
	fs: FsAdapter,
	ctx: MatcherContext,
	extractor: Extractor,
): Promise<Source | "none"> {
	let abs = unixify(cwd)
	if (abs.endsWith("/")) {
		abs += extractor.path
	} else {
		abs += "/" + extractor.path
	}
	const path = relative(cwd, abs)
	const name = path.substring(path.lastIndexOf("/") + 1)

	const newSource: Source = {
		name,
		path,
		inverted: false,
		pattern: [],
	}

	let buff: Buffer | undefined
	try {
		buff = await fs.promises.readFile(abs)
	} catch (err) {
		const error = err as NodeJS.ErrnoException
		if (error.code === "ENOENT") {
			return "none"
		}
		newSource.error = error
		return newSource
	}

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
}
