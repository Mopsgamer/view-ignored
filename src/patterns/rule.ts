import { dirname } from "node:path/posix"

import type { PatternFinderOptions } from "./extractor.js"
import type { Source } from "./source.js"

import { patternCacheTest, type PatternList, type PatternCache } from "./patternList.js"
import { resolveSources } from "./resolveSources.js"

/**
 * Represents a set of include and exclude patterns.
 * These patterns are positive minimatch patterns.
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
 * @since 0.9.1
 */
export interface RuleMatchBaseErrorPattern<K extends string> extends RuleMatchBasePattern<K> {
	error: Error
}

/**
 * @see {@link RuleMatch}
 *
 * @since 0.9.1
 */
export interface RuleMatchBaseSourcePattern<K extends string>
	extends RuleMatchBasePattern<K>, RuleMatchBaseSource<K> {}

/**
 * @see {@link ruleTest}
 *
 * @since 0.6.0
 */
export type RuleMatch =
	| RuleMatchBase<"none" | "missing-source">
	| RuleMatchBaseSource<"no-match" | "broken-source" | "invalid-pattern">
	| RuleMatchBaseErrorPattern<"invalid-internal-pattern">
	| RuleMatchBasePattern<"internal">
	| RuleMatchBaseSourcePattern<"external">

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

function testInternal(options: RuleTestOptions, path: string): RuleMatch | null {
	for (const si of options.target.internalRules) {
		const compiled = si.compiled
		if (compiled === null) continue

		let [patternMatch, error] = cacheTest(compiled, path)
		if (error)
			return {
				kind: "invalid-internal-pattern",
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

function testExternal(options: RuleTestOptions, path: string, source: Source): RuleMatch {
	for (const si of source.pattern) {
		const compiled = si.compiled
		if (compiled === null) {
			continue
		}

		let [patternMatch, err] = cacheTest(compiled, path)
		if (err) {
			source.error = err
			options.ctx?.failed.push(source)
			return {
				kind: "invalid-pattern",
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
	const parent = dirname(options.entry)
	let source = options.ctx?.external.get(parent)

	if (source === undefined) {
		await resolveSources({ ...options, dir: parent })
		source = options.ctx.external.get(parent)
	}

	if (source === undefined) {
		throw new Error("view-ignored has crashed: no source cached.")
	}

	if (source === "none") {
		return { kind: "missing-source", ignored: false }
	}

	if (typeof source === "object" && source.error) {
		return { kind: "broken-source", ignored: true, source }
	}

	let internalMatch = testInternal(options, options.entry)
	if (internalMatch !== null) {
		return internalMatch
	}

	const externalMatch = testExternal(options, options.entry, source)
	return externalMatch
}
