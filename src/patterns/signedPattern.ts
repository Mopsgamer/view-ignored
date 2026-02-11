import { dirname } from "node:path/posix"

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
 * @since 0.6.0
 */
export type SignedPattern = {
	/**
	 * Provides ignored or included file and directory patterns.
	 *
	 * @see {@link signedPatternIgnores} provides the ignoring algorithm.
	 *
	 * @since 0.6.0
	 */
	include: Pattern
	/**
	 * Provides ignored or included file and directory patterns.
	 *
	 * @see {@link signedPatternIgnores} provides the ignoring algorithm.
	 *
	 * @since 0.6.0
	 */
	exclude: Pattern
	/**
	 * Provides compiled ignored or included file and directory patterns.
	 *
	 * @see {@link signedPatternIgnores} provides the ignoring algorithm.
	 *
	 * @since 0.6.0
	 */
	compiled: null | {
		/**
		 * Provides compiled ignored or included file and directory patterns.
		 *
		 * @see {@link signedPatternIgnores} provides the ignoring algorithm.
		 *
		 * @since 0.6.0
		 */
		include: PatternMinimatch[]
		/**
		 * Provides compiled ignored or included file and directory patterns.
		 *
		 * @see {@link signedPatternIgnores} provides the ignoring algorithm.
		 *
		 * @since 0.6.0
		 */
		exclude: PatternMinimatch[]
	}
}

/**
 * @see {@link signedPatternIgnores}
 *
 * @since 0.6.0
 */
export type SignedPatternMatch =
	| {
			kind: "none" | "missing-source"
			ignored: boolean
	  }
	| {
			kind: "no-match" | "broken-source" | "invalid-pattern"
			ignored: boolean
			source: Source
	  }
	| {
			kind: "invalid-internal-pattern"
			pattern: string
			error: Error
			ignored: boolean
	  }
	| {
			kind: "internal"
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
 * @since 0.6.0
 */
export interface SignedPatternIgnoresOptions extends PatternFinderOptions {
	/**
	 * Relative entry path.
	 *
	 * @example
	 * "dir/subdir"
	 * "dir/subdir/index.js"
	 *
	 * @since 0.6.0
	 */
	entry: string
	/**
	 * The internal pattern. Should be compiled.
	 *
	 * @since 0.6.0
	 */
	internal: SignedPattern
}

function patternRegExpTest(path: string, rs: PatternMinimatch[]): [string, Error | undefined] {
	for (const r of rs) {
		try {
			if (patternMinimatchTest(r, path)) {
				return [r.pattern, undefined]
			}
		} catch (err) {
			return [r.pattern, err as Error]
		}
	}
	return ["", undefined]
}

function signedPatternCompiledMatchInternal(
	options: SignedPatternIgnoresOptions,
	path: string,
): SignedPatternMatch | null {
	let patternMatch: string = ""
	let err: Error | undefined
	const kind = "internal" as const

	const signedPattern = options.internal
	const compiled = signedPattern.compiled! // no null

	try {
		;[patternMatch, err] = patternRegExpTest(path, compiled.exclude)
		if (err) {
			throw err
		}
		if (patternMatch) {
			// return true
			return { kind, pattern: patternMatch, ignored: true }
		}
		;[patternMatch, err] = patternRegExpTest(path, compiled.include)
		if (err) {
			throw err
		}
		if (patternMatch) {
			// return false
			return { kind, pattern: patternMatch, ignored: false }
		}
	} catch (error) {
		return {
			kind: "invalid-internal-pattern",
			pattern: patternMatch,
			error: error as Error,
			ignored: false,
		}
	}

	return null
}

function signedPatternCompiledMatchExternal(
	options: SignedPatternIgnoresOptions,
	path: string,
	source: Source,
): SignedPatternMatch {
	let patternMatch: string = ""
	let err: Error | undefined
	const kind = "external" as const

	const signedPattern = source.pattern
	const compiled = signedPattern.compiled! // no null

	try {
		if (source.inverted) {
			;[patternMatch, err] = patternRegExpTest(path, compiled.exclude)
			if (err) {
				throw err
			}
			if (patternMatch) {
				// return true
				return { kind, source, pattern: patternMatch, ignored: true }
			}

			;[patternMatch, err] = patternRegExpTest(path, compiled.include)
			if (err) {
				throw err
			}
			if (patternMatch) {
				// return false
				return { kind, source, pattern: patternMatch, ignored: false }
			}
		} else {
			;[patternMatch, err] = patternRegExpTest(path, compiled.include)
			if (err) {
				throw err
			}
			if (patternMatch) {
				// return false
				return { kind, source, pattern: patternMatch, ignored: false }
			}

			;[patternMatch, err] = patternRegExpTest(path, compiled.exclude)
			if (err) {
				throw err
			}
			if (patternMatch) {
				// return true
				return { kind, source, pattern: patternMatch, ignored: true }
			}
		}
	} catch (err) {
		source.error = err as Error
		options.ctx?.failed.push(source!)
		return { kind: "invalid-pattern", ignored: false, source }
	}
	return { kind: "no-match", ignored: source.inverted, source }
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
 * @since 0.6.0
 */
export async function signedPatternIgnores(
	options: SignedPatternIgnoresOptions,
): Promise<SignedPatternMatch> {
	const parent = dirname(options.entry)
	let source = options.ctx?.external.get(parent)

	if (source === undefined) {
		await resolveSources({ ...options, dir: parent, root: options.root })
		source = options.ctx.external.get(parent)
	}

	if (source === undefined || source === "none") {
		return { kind: "missing-source", ignored: true }
	}

	if (typeof source === "object" && source.error) {
		return { kind: "broken-source", ignored: true, source }
	}

	let internalMatch = signedPatternCompiledMatchInternal(options, options.entry)
	if (internalMatch !== null) {
		return internalMatch
	}

	const externalMatch = signedPatternCompiledMatchExternal(options, options.entry, source)
	return externalMatch
}
