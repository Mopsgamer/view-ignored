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
export interface RuleMatchBase<K extends string | number | symbol> {
	kind: K
	ignored: boolean
}

/**
 * @see {@link RuleMatch}
 *
 * @since 0.9.1
 */
export interface RuleMatchBaseSource<K extends string | number | symbol> extends RuleMatchBase<K> {
	source: Source
}

/**
 * @see {@link RuleMatch}
 *
 * @since 0.9.1
 */
export interface RuleMatchBasePattern<K extends string | number | symbol> extends RuleMatchBase<K> {
	pattern: string
}

/**
 * @see {@link RuleMatch}
 *
 * @since 0.11.0
 */
export interface RuleMatchBaseError<K extends string | number | symbol> extends RuleMatchBase<K> {
	error: Error
}

/**
 * @see {@link RuleMatch}
 *
 * @since 0.11.0
 */
export interface RuleMatchBaseInvalidSource<K extends string | number | symbol>
	extends RuleMatchBaseError<K>, RuleMatchBaseSource<K> {}

/**
 * @see {@link RuleMatch}
 *
 * @since 0.11.0
 */
export interface RuleMatchBaseInvalidPattern<K extends string | number | symbol>
	extends RuleMatchBasePattern<K>, RuleMatchBaseError<K> {}

/**
 * @see {@link RuleMatch}
 *
 * @since 0.11.0
 */
export interface RuleMatchBaseInvalidExternal<K extends string | number | symbol>
	extends RuleMatchBaseInvalidPattern<K>, RuleMatchBaseSource<K> {}

/**
 * @see {@link RuleMatch}
 *
 * @since 0.9.1
 */
export interface RuleMatchBaseExternal<K extends string | number | symbol>
	extends RuleMatchBasePattern<K>, RuleMatchBaseSource<K> {}

/**
 * @since 0.11.0
 */
export const enum RuleMatchKind {
	"none",
	"missingSource",
	"noMatch",
	"invalidSource",
	"invalidExternal",
	"invalidInternal",
	"external",
	"internal",
}

/**
 * @see {@link ruleTest}
 *
 * @since 0.6.0
 */
export type RuleMatch =
	| RuleMatchBase<RuleMatchKind.none>
	| RuleMatchBase<RuleMatchKind.missingSource>
	| RuleMatchBaseSource<RuleMatchKind.noMatch>
	| RuleMatchBaseInvalidSource<RuleMatchKind.invalidSource>
	| RuleMatchBaseInvalidExternal<RuleMatchKind.invalidExternal>
	| RuleMatchBaseInvalidPattern<RuleMatchKind.invalidInternal>
	| RuleMatchBaseExternal<RuleMatchKind.external>
	| RuleMatchBasePattern<RuleMatchKind.internal>

/**
 * Check if a rule match is invalid.
 *
 * @since 0.11.0
 */
export function isRuleMatchInvalid(
	match: RuleMatch,
): match is
	| RuleMatchBaseInvalidSource<RuleMatchKind.invalidSource>
	| RuleMatchBaseInvalidExternal<RuleMatchKind.invalidExternal>
	| RuleMatchBaseInvalidPattern<RuleMatchKind.invalidInternal> {
	return (
		match.kind === RuleMatchKind.invalidSource ||
		match.kind === RuleMatchKind.invalidExternal ||
		match.kind === RuleMatchKind.invalidInternal
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
}

type TestResult = {
	pattern: string
	error: Error | undefined
}

function cacheTest(rs: PatternCache[], path: string, out: TestResult): boolean {
	const len = rs.length
	for (let i = 0; i < len; i++) {
		const r = rs[i]!
		try {
			if (patternCacheTest(r, path)) {
				out.pattern = r.pattern
				out.error = undefined
				return true
			}
		} catch (err) {
			out.pattern = r.pattern
			out.error = err as Error
			return true
		}
	}
	return false
}

function testInternal(
	options: RuleTestOptions,
):
	| RuleMatchBaseInvalidPattern<RuleMatchKind.invalidInternal>
	| RuleMatchBasePattern<RuleMatchKind.internal>
	| null {
	const test: TestResult = { error: undefined, pattern: "" }
	for (const { compiled, excludes } of options.target.internalRules) {
		if (!cacheTest(compiled!, options.entry, test)) continue
		if (test.error !== undefined)
			return <RuleMatchBaseInvalidPattern<RuleMatchKind.invalidInternal>>{
				error: test.error,
				ignored: false,
				kind: RuleMatchKind.invalidInternal,
				pattern: test.pattern,
			}

		return <RuleMatchBasePattern<RuleMatchKind.internal>>{
			ignored: excludes,
			kind: RuleMatchKind.internal,
			pattern: test.pattern,
		}
	}

	return null
}

function testExternal(
	path: string,
	source: Source,
):
	| RuleMatchBaseInvalidExternal<RuleMatchKind.invalidExternal>
	| RuleMatchBaseExternal<RuleMatchKind.external>
	| RuleMatchBaseSource<RuleMatchKind.noMatch> {
	const test: TestResult = { error: undefined, pattern: "" }
	for (const { compiled, excludes } of source.rules) {
		if (!cacheTest(compiled!, path, test)) continue
		if (test.error !== undefined) {
			return <RuleMatchBaseInvalidExternal<RuleMatchKind.invalidExternal>>{
				error: test.error,
				ignored: false,
				kind: RuleMatchKind.invalidExternal,
				pattern: test.pattern,
				source,
			}
		}

		return <RuleMatchBaseExternal<RuleMatchKind.external>>{
			ignored: excludes,
			kind: RuleMatchKind.external,
			pattern: test.pattern,
			source,
		}
	}

	return <RuleMatchBaseSource<RuleMatchKind.noMatch>>{
		ignored: source.inverted,
		kind: RuleMatchKind.noMatch,
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
	const src = options.resource

	if (src === undefined) {
		throw new Error("view-ignored has crashed: no source cached.")
	}

	if (src === null) {
		return { ignored: false, kind: RuleMatchKind.missingSource }
	}

	if ("error" in src) {
		return { ...src, ignored: true, kind: RuleMatchKind.invalidSource }
	}

	let internalMatch = testInternal(options)
	if (internalMatch !== null) {
		return internalMatch
	}

	const externalMatch = testExternal(options.entry, src)
	return externalMatch
}
