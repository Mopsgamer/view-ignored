import { dirname } from "node:path/posix"

import type { Target } from "../targets/target.js"
import type { FsAdapter } from "../types.js"
import type { PatternFinderOptions, Extractor } from "./extractor.js"
import type { MatcherContext } from "./matcherContext.js" // oxlint-disable-line no-unused-vars used by tsdoc
import type { PatternCompileOptions } from "./patternCompile.js"
import type { Resource } from "./resource.js"
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
	 * Equals to `dirname(dir)`.
	 *
	 * @since 0.11.0
	 */
	parentPath?: string
}

/**
 * Populates the {@link MatcherContext.external} map with {@link Source} objects.
 *
 * @since 0.6.0
 */
export async function resolveSources(options: ResolveSourcesOptions): Promise<Resource> {
	const resource = options.resource
	if (typeof resource !== "undefined") {
		return resource
	}
	const { fs, external, cwd, signal, target, parentPath } = options
	let dir = options.dir

	let source: Resource | undefined
	const noSourceDirList: string[] = [dir]

	if (dir !== ".") {
		dir = parentPath ?? dirname(dir)

		// find source from an ancestor [dir < ... < cwd]
		while (true) {
			signal?.throwIfAborted()
			source = external.get(dir)
			if (source !== undefined) {
				// if cache is found populate descendants [cwd > ... > dir]
				for (const noSourceDir of noSourceDirList) {
					external.set(noSourceDir, source)
				}
				return source
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
			signal?.throwIfAborted()
			preCwdSegments.push(c)
			if (c === target.root) break
			const parent = dirname(c)
			c = parent
		}
		preCwdSegments.reverse()

		source = await findSourceForAbsoluteDirs(preCwdSegments, fs, target, signal)
		if (typeof source === "object") {
			for (const noSourceDir of noSourceDirList) {
				signal?.throwIfAborted()
				external.set(noSourceDir, source)
			}
			return source
		}
	}

	const absPaths = noSourceDirList.map((rel) => join(cwd, rel))
	source = await findSourceForAbsoluteDirs(absPaths, fs, target, signal)
	if (source !== undefined) {
		for (const noSourceDir of noSourceDirList) {
			signal?.throwIfAborted()
			external.set(noSourceDir, source)
		}
	}
	return source
}

async function findSourceForAbsoluteDirs(
	paths: string[],
	fs: FsAdapter,
	target: Target,
	signal: AbortSignal | null,
): Promise<Resource> {
	const results = await Promise.all(
		paths.flatMap((parent) =>
			target.extractors.map(async (extractor) => {
				signal?.throwIfAborted()
				return await tryExtractor(parent, fs, extractor)
			}),
		),
	)

	for (const s of results) {
		if (typeof s === "object") {
			return s
		}
	}

	return "none"
}

async function tryExtractor(cwd: string, fs: FsAdapter, extractor: Extractor): Promise<Resource> {
	let abs = join(cwd, extractor.path)
	const name = base(extractor.path)

	const newSource: Source = {
		inverted: false,
		name,
		path: extractor.path,
		rules: [],
	}

	let buff: Buffer | undefined
	try {
		buff = await fs.promises.readFile(abs)
	} catch (err) {
		const error = err as NodeJS.ErrnoException
		if (error.code === "ENOENT") {
			return "none"
		}
		return { error, source: newSource }
	}

	try {
		const act = extractor.extract(newSource, buff)
		if (typeof act === "string") {
			return act
		}
	} catch (err) {
		if (typeof err === "string") {
			return err as "none"
		}
		const error =
			err instanceof Error
				? err
				: new Error("Unknown error during source extraction", { cause: err })
		return { error, source: newSource }
	}
	return newSource
}
