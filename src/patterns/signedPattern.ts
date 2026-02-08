import { dirname } from "node:path"

import type { PatternFinderOptions } from "./extractor.js"
import { patternMinimatchTest, type Pattern, type PatternMinimatch } from "./pattern.js"
import { resolveSources } from "./resolveSources.js"
import type { Source } from "./source.js"

/**
 * Represents a set of include and exclude patterns.
 * These patterns are positive minimatch patterns.
 *
 * @see {@link PatternMatcher} uses it.
 * @see {@link signedPatternIgnores} provides the ignoring algorithm.
 * @see {@link signedPatternCompile} compiles the signed pattern.
 * Use this or an extractor's method to compile.
 *
 * @since 0.0.6
 */
export type SignedPattern = {
	/**
	 * Provides ignored or included file and directory patterns.
	 *
	 * @see {@link signedPatternIgnores} provides the ignoring algorithm.
	 *
	 * @since 0.0.6
	 */
	include: Pattern
	/**
	 * Provides ignored or included file and directory patterns.
	 *
	 * @see {@link signedPatternIgnores} provides the ignoring algorithm.
	 *
	 * @since 0.0.6
	 */
	exclude: Pattern
	/**
	 * Provides compiled ignored or included file and directory patterns.
	 *
	 * @see {@link signedPatternIgnores} provides the ignoring algorithm.
	 *
	 * @since 0.0.6
	 */
	compiled: null | {
		/**
		 * Provides compiled ignored or included file and directory patterns.
		 *
		 * @see {@link signedPatternIgnores} provides the ignoring algorithm.
		 *
		 * @since 0.0.6
		 */
		include: PatternMinimatch[]
		/**
		 * Provides compiled ignored or included file and directory patterns.
		 *
		 * @see {@link signedPatternIgnores} provides the ignoring algorithm.
		 *
		 * @since 0.0.6
		 */
		exclude: PatternMinimatch[]
	}
}

/**
 * @see {@link signedPatternIgnores}
 *
 * @since 0.0.6
 */
export type SignedPatternMatch =
	| {
			kind:
				| "none"
				| "no-match"
				| "invalid-internal-pattern"
				| "missing-source"
				| "broken-source"
				| "invalid-pattern"
			ignored: boolean
	  }
	| {
			kind: "internal" | "external"
			pattern: string
			ignored: boolean
	  }
	| {
			kind: "external"
			pattern: string
			source: Source
			ignored: boolean
	  }

/**
 * @see {@link signedPatternIgnores}
 *
 * @since 0.0.6
 */
export interface SignedPatternIgnoresOptions extends PatternFinderOptions {
	/**
	 * Relative entry path.
	 *
	 * @example
	 * "dir/subdir"
	 * "dir/subdir/index.js"
	 *
	 * @since 0.0.6
	 */
	entry: string
	/**
	 * The internal pattern. Should be compiled.
	 *
	 * @since 0.0.6
	 */
	internal: SignedPattern
}

function patternRegExpTest(path: string, rs: PatternMinimatch[]): string {
	{
		// TODO: options.ctx.paths should provide patternIndex, not pattern
		// const cache = options.ctx.paths.get(path)
		// if (cache && cache.kind === "external" && cache.patternIndex >= 0) {
		// 	rs = rs.slice(cache.patternIndex)
		// }
	}
	for (const r of rs) {
		if (patternMinimatchTest(r, path)) {
			return r.pattern
		}
	}
	return ""
}

function signedPatternCompiledMatchInternal(
	options: SignedPatternIgnoresOptions,
	path: string,
): SignedPatternMatch {
	let patternMatch: string = ""
	const kind = "internal" as const

	const signedPattern = options.internal
	const compiled = signedPattern.compiled! // no null

	try {
		patternMatch = patternRegExpTest(path, compiled.exclude)
		if (patternMatch) {
			// return true
			return { kind, pattern: patternMatch, ignored: true }
		}

		patternMatch = patternRegExpTest(path, compiled.include)
		if (patternMatch) {
			// return false
			return { kind, pattern: patternMatch, ignored: false }
		}
	} catch {
		return { kind: "invalid-internal-pattern", ignored: false }
	}
	return { kind: "no-match", ignored: true }
}

function signedPatternCompiledMatchExternal(
	options: SignedPatternIgnoresOptions,
	path: string,
	source: Source,
): SignedPatternMatch {
	let patternMatch: string = ""
	const kind = "external" as const

	const signedPattern = source.pattern
	const compiled = signedPattern.compiled! // no null

	try {
		if (source.inverted) {
			patternMatch = patternRegExpTest(path, compiled.exclude)
			if (patternMatch) {
				// return true
				return { kind, source, pattern: patternMatch, ignored: true }
			}

			patternMatch = patternRegExpTest(path, compiled.include)
			if (patternMatch) {
				// return false
				return { kind, source, pattern: patternMatch, ignored: false }
			}
		} else {
			patternMatch = patternRegExpTest(path, compiled.include)
			if (patternMatch) {
				// return false
				return { kind, source, pattern: patternMatch, ignored: false }
			}

			patternMatch = patternRegExpTest(path, compiled.exclude)
			if (patternMatch) {
				// return true
				return { kind, source, pattern: patternMatch, ignored: true }
			}
		}
	} catch (err) {
		source.error = err as Error
		options.ctx.failed.push(source!)
		return { kind: "invalid-pattern", ignored: false }
	}
	return { kind: "no-match", ignored: source.inverted }
}

/**
 * Checks whether a given entry should be ignored based on internal and external patterns.
 * Populates unknown sources using {@link resolveSources}.
 *
 * Algorithm:
 * 1. Check internal exclude patterns. If matched, return true.
 * 2. Check internal include patterns. If matched, return false.
 * 3. Check external patterns:
 *    - If not inverted:
 *      a. Check external include patterns. If matched, return false.
 *      b. Check external exclude patterns. If matched, return true.
 *    - If inverted:
 *      a. Check external exclude patterns. If matched, return true.
 *      b. Check external include patterns. If matched, return false.
 * 4. If no patterns matched, return the inverted state.
 *
 * @since 0.0.6
 */
export async function signedPatternIgnores(
	options: SignedPatternIgnoresOptions,
): Promise<SignedPatternMatch> {
	const parent = dirname(options.entry)
	let source = options.ctx.external.get(parent)

	if (source === undefined) {
		const failedPrev = options.ctx.failed.length
		await resolveSources({ ...options, dir: parent, root: options.root })
		if (failedPrev < options.ctx.failed.length) {
			return { kind: "broken-source", ignored: false }
		}

		source = options.ctx.external.get(parent)
	}

	let internalMatch = signedPatternCompiledMatchInternal(options, options.entry)
	if (internalMatch.kind !== "no-match") {
		return internalMatch
	}

	if (source === undefined || source === "none") {
		return { kind: "no-match", ignored: false }
	}

	const externalMatch = signedPatternCompiledMatchExternal(options, options.entry, source)
	return externalMatch
}
