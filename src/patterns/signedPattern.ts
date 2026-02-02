import type { PatternFinderOptions } from "./extractor.js"
import { dirname } from "node:path"
import { patternMatches, type Pattern } from "./pattern.js"
import { sourcesBackwards } from "./sourcesBackwards.js"

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
			negated: boolean
			pattern: string
			ignored: boolean
	  }

/**
 * @see {@link signedPatternIgnores}
 */
export interface SignedPatternIgnoresOptions extends PatternFinderOptions {
	entry: string
	internal: SignedPattern
}

/**
 * Checks whether a given entry should be ignored based on internal and external patterns.
 * Populates unknown sources using {@link sourcesBackwards}.
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
		await sourcesBackwards({ ...options, dir: parent })

		if (options.ctx.failed) {
			return { kind: "broken-source", ignored: false }
		}

		source = options.ctx.external.get(parent)
	}

	const internal = options.internal

	try {
		let check: string = ""

		check = patternMatches(internal.exclude, options.entry)
		if (check) {
			// return true
			return { kind: "internal", negated: true, pattern: check, ignored: true }
		}

		check = patternMatches(internal.include, options.entry)
		if (check) {
			// return false
			return { kind: "internal", negated: false, pattern: check, ignored: false }
		}
	} catch {
		options.ctx.failed = true
		return { kind: "invalid-internal-pattern", ignored: false }
	}

	if (!source) {
		return { kind: "no-match", ignored: false }
	}

	const external = source.pattern

	try {
		let check: false | string = false

		if (!source.inverted) {
			check = patternMatches(external.include, options.entry)
			if (check) {
				// return false
				return { kind: "external", negated: true, pattern: check, ignored: false }
			}

			check = patternMatches(external.exclude, options.entry)
			if (check) {
				// return true
				return { kind: "external", negated: false, pattern: check, ignored: true }
			}
		} else {
			check = patternMatches(external.exclude, options.entry)
			if (check) {
				// return true
				return { kind: "external", negated: false, pattern: check, ignored: true }
			}

			check = patternMatches(external.include, options.entry)
			if (check) {
				// return false
				return { kind: "external", negated: true, pattern: check, ignored: false }
			}
		}
	} catch (err) {
		source.error = err as Error
		options.ctx.failed = true
		return { kind: "invalid-pattern", ignored: false }
	}

	return { kind: "no-match", ignored: source.inverted }
}
