import type { PatternFinderOptions } from "./extractor.js"
import type { Source } from "./source.js"

import { patternCacheTest, type PatternList, type PatternCache } from "./patternList.js"

/**
 * Represents a set of include and exclude patterns.
 * These patterns are positive glob patterns.
 *
 * @see {@link ruleTest} provides the ignoring algorithm.
 * @see {@link ruleCompile} compiles the signed pattern.
 * Use this or an extractor's method to compile.
 *
 * @since 0.6.0
 */
export type Rule = {
	/**
	 * Provides ignored or included file and directory patterns.
	 *
	 * @see {@link ruleTest} provides the ignoring algorithm.
	 *
	 * @since 0.9.0
	 */
	pattern: PatternList
	/**
	 * If `true`, pattern "test" will exclude file named "test".
	 *
	 * @see {@link ruleTest} provides the ignoring algorithm.
	 *
	 * @since 0.9.0
	 */
	excludes: boolean
	/**
	 * Provides compiled ignored or included file and directory patterns.
	 *
	 * @see {@link ruleTest} provides the ignoring algorithm.
	 *
	 * @since 0.6.0
	 */
	compiled: null | PatternCache[]
}

/**
 * The kind of a pattern match.
 *
 * @since 0.9.1
 */
export type MatchKind = RuleMatch["kind"]

/**
 * @see {@link RuleMatch}
 *
 * @since 0.9.1
 */
export interface RuleMatchBase<K extends string> {
	kind: K
	ignored: boolean
}

/**
 * @see {@link RuleMatch}
 *
 * @since 0.9.1
 */
export interface RuleMatchBaseSource<K extends string> extends RuleMatchBase<K> {
	source: Source
}

/**
 * @see {@link RuleMatch}
 *
 * @since 0.9.1
 */
export interface RuleMatchBasePattern<K extends string> extends RuleMatchBase<K> {
	pattern: string
}

/**
 * @see {@link RuleMatch}
 *
 * @since 0.11.0
 */
export interface RuleMatchBaseError<K extends string> extends RuleMatchBase<K> {
	error: Error
}

/**
 * @see {@link RuleMatch}
 *
 * @since 0.11.0
 */
export interface RuleMatchBaseInvalidSource<K extends string>
	extends RuleMatchBaseError<K>, RuleMatchBaseSource<K> {}

/**
 * @see {@link RuleMatch}
 *
 * @since 0.11.0
 */
export interface RuleMatchBaseInvalidPattern<K extends string>
	extends RuleMatchBasePattern<K>, RuleMatchBaseError<K> {}

/**
 * @see {@link RuleMatch}
 *
 * @since 0.11.0
 */
export interface RuleMatchBaseInvalidExternal<K extends string>
	extends RuleMatchBaseInvalidPattern<K>, RuleMatchBaseSource<K> {}

/**
 * @see {@link RuleMatch}
 *
 * @since 0.9.1
 */
export interface RuleMatchBaseExternal<K extends string>
	extends RuleMatchBasePattern<K>, RuleMatchBaseSource<K> {}

/**
 * @see {@link ruleTest}
 *
 * @since 0.6.0
 */
export type RuleMatch =
	| RuleMatchBase<"none" | "missing-source">
	| RuleMatchBaseSource<"no-match">
	| RuleMatchBaseInvalidSource<"invalid-source">
	| RuleMatchBaseInvalidExternal<"invalid-external">
	| RuleMatchBaseInvalidPattern<"invalid-internal">
	| RuleMatchBaseExternal<"external">
	| RuleMatchBasePattern<"internal">

/**
 * Check if a rule match is invalid.
 *
 * @since 0.11.0
 */
export function isRuleMatchInvalid(
	match: RuleMatch,
): match is
	| RuleMatchBaseInvalidSource<"invalid-source">
	| RuleMatchBaseInvalidExternal<"invalid-external">
	| RuleMatchBaseInvalidPattern<"invalid-internal"> {
	return (
		match.kind === "invalid-source" ||
		match.kind === "invalid-external" ||
		match.kind === "invalid-internal"
	)
}

/**
 * @see {@link ruleTest}
 *
 * @since 0.6.0
 */
export interface RuleTestOptions extends PatternFinderOptions {
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
	 * Result of the `dirname(entry)` call.
	 *
	 * @since 0.10.1
	 */
	parentPath: string
}

function cacheTest(rs: PatternCache[], path: string): [string, Error | undefined] {
	for (const r of rs) {
		try {
			if (patternCacheTest(r, path)) {
				return [r.pattern, undefined]
			}
		} catch (err) {
			return [r.pattern, err as Error]
		}
	}
	return ["", undefined]
}

function testInternal(internalRules: Rule[], path: string): RuleMatch | null {
	for (const si of internalRules) {
		const compiled = si.compiled
		if (compiled === null) continue

		let [patternMatch, error] = cacheTest(compiled, path)
		if (error)
			return {
				kind: "invalid-internal",
				pattern: patternMatch,
				error,
				ignored: false,
			}

		if (patternMatch)
			return {
				kind: "internal",
				pattern: patternMatch,
				ignored: si.excludes,
			}
	}

	return null
}

function testExternal(path: string, source: Source): RuleMatch {
	for (const si of source.rules) {
		const compiled = si.compiled
		if (compiled === null) {
			continue
		}

		let [patternMatch, err] = cacheTest(compiled, path)
		if (err) {
			return {
				kind: "invalid-external",
				error: err,
				pattern: patternMatch,
				ignored: false,
				source,
			}
		}

		if (patternMatch)
			return {
				kind: "external",
				pattern: patternMatch,
				ignored: si.excludes,
				source,
			}
	}

	return {
		kind: "no-match",
		ignored: source.inverted,
		source,
	}
}

/**
 * Checks whether a given entry should be ignored based on internal and external patterns.
 * Populates unknown sources using {@link resolveSources}.
 *
 * @since 0.6.0
 */
export async function ruleTest(options: RuleTestOptions): Promise<RuleMatch> {
	const parent = options.parentPath
	const src = options.external.get(parent)

	// if (source === undefined) {
	// 	await resolveSources({ ...options, dir: parent })
	// 	source = options.ctx.external.get(parent)
	// }

	if (src === undefined) {
		throw new Error("view-ignored has crashed: no source cached.")
	}

	if (src === "none") {
		return { kind: "missing-source", ignored: false }
	}

	if (typeof src === "object" && "error" in src) {
		const { source, error } = src
		return { kind: "invalid-source", ignored: true, source, error }
	}

	let internalMatch = testInternal(options.target.internalRules, options.entry)
	if (internalMatch !== null) {
		return internalMatch
	}

	const externalMatch = testExternal(options.entry, src)
	return externalMatch
}
