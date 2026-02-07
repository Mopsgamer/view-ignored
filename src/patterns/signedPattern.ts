import type { PatternFinderOptions } from "./extractor.js"
import type { Source } from "./source.js"
import { dirname } from "node:path"
import {
	patternCompile,
	patternMinimatchTest,
	type Pattern,
	type PatternMinimatch,
} from "./pattern.js"
import { resolveSources } from "./resolveSources.js"

/**
 * Represents a set of include and exclude patterns.
 * These patterns are positive minimatch patterns.
 *
 * @see {@link PatternMatcher}
 * @see {@link signedPatternIgnores}
 */
export type SignedPattern = {
	include: Pattern
	exclude: Pattern
	compiled: null | {
		include: PatternMinimatch[]
		exclude: PatternMinimatch[]
	}
}

/**
 * @see {@link signedPatternIgnores}
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
 */
export interface SignedPatternIgnoresOptions extends PatternFinderOptions {
	entry: string
	internal: SignedPattern
}

export function signedPatternCompile(signedPattern: SignedPattern): void {
	signedPattern.compiled = {
		include: patternCompile(signedPattern.include),
		exclude: patternCompile(signedPattern.exclude),
	}
}

function signedPatternCompiledMatch(
	options: SignedPatternIgnoresOptions,
	kind: "external" | "internal",
	path: string,
	source: Source | undefined,
): SignedPatternMatch {
	let patternMatch: string = ""

	function patternRegExpTest(rs: PatternMinimatch[]): string {
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

	if (!source && kind === "external") {
		return { kind: "no-match", ignored: false }
	}
	const signedPattern = kind === "internal" ? options.internal : source!.pattern
	const compiled = signedPattern.compiled!

	try {
		if (kind === "internal" || source?.inverted) {
			patternMatch = patternRegExpTest(compiled.exclude)
			if (patternMatch) {
				// return true
				if (kind === "internal") return { kind, pattern: patternMatch, ignored: true }
				return { kind, source, pattern: patternMatch, ignored: true }
			}

			patternMatch = patternRegExpTest(compiled.include)
			if (patternMatch) {
				// return false
				if (kind === "internal") return { kind, pattern: patternMatch, ignored: false }
				return { kind, source, pattern: patternMatch, ignored: false }
			}
		} else {
			patternMatch = patternRegExpTest(compiled.include)
			if (patternMatch) {
				// return false
				return { kind, source, pattern: patternMatch, ignored: false }
			}

			patternMatch = patternRegExpTest(compiled.exclude)
			if (patternMatch) {
				// return true
				return { kind, source, pattern: patternMatch, ignored: true }
			}
		}
	} catch (err) {
		if (kind === "internal") {
			return { kind: "invalid-pattern", ignored: false }
		}
		source!.error = err as Error
		options.ctx.failed.push(source!)
		return { kind: "invalid-internal-pattern", ignored: false }
	}
	return { kind: "no-match", ignored: source?.inverted ?? true }
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
 * 4. If no patterns matched, return true if external is inverted, else false.
 */
export async function signedPatternIgnores(
	options: SignedPatternIgnoresOptions,
): Promise<SignedPatternMatch> {
	const parent = dirname(options.entry)
	let source = options.ctx.external.get(parent)

	if (!source) {
		await resolveSources({ ...options, dir: parent, root: options.root })

		if (options.ctx.failed.length) {
			return { kind: "broken-source", ignored: false }
		}

		source = options.ctx.external.get(parent)
	}

	let r = signedPatternCompiledMatch(options, "internal", options.entry, source)
	if (r.kind === "internal") {
		return r
	}

	return signedPatternCompiledMatch(options, "external", options.entry, source)
}
