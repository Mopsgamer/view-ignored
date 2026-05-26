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
 * The kind of a pattern match.
 *
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
	const k = match.kind
	return (
		k === RuleMatchKind.invalidSource ||
		k === RuleMatchKind.invalidExternal ||
		k === RuleMatchKind.invalidInternal
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
	 * Pre-lowercased entry path.
	 *
	 * @since 0.11.0
	 */
	lowerEntry?: string
}

function cacheTest(
	rs: PatternCache[],
	path: string,
	matchCtx: { lower?: string },
): PatternCache | Error | null {
	const len = rs.length
	for (let i = 0; i < len; i++) {
		const r = rs[i]!
		try {
			if (patternCacheTest(r, path, matchCtx)) {
				return r
			}
		} catch (err) {
			return err as Error
		}
	}
	return null
}

/**
 * Synchronous version of {@link ruleTest}.
 *
 * @since 0.11.0
 */
export function ruleTestSync(options: RuleTestOptions): RuleMatch {
	const src = options.resource

	if (src === undefined) {
		throw new Error("view-ignored has crashed: no source cached.")
	}

	const entry = options.entry
	const matchCtx = { lower: options.lowerEntry }

	const internalRules = options.target.internalRules
	for (let i = 0, len = internalRules.length; i < len; i++) {
		const rule = internalRules[i]!
		if (!rule.compiled) continue
		const res = cacheTest(rule.compiled, entry, matchCtx)
		if (res === null) continue
		if (res instanceof Error) {
			return {
				error: res,
				ignored: false,
				kind: RuleMatchKind.invalidInternal,
				pattern: "",
			}
		}

		return {
			ignored: rule.excludes,
			kind: RuleMatchKind.internal,
			pattern: res.pattern,
		}
	}

	if (src === null) {
		return { ignored: false, kind: RuleMatchKind.missingSource }
	}

	if ("error" in src) {
		return { ...src, ignored: true, kind: RuleMatchKind.invalidSource }
	}

	const rules = src.rules
	const elen = rules.length
	if (elen === 0) {
		return (
			(src._noMatchCache as any) ??
			(src._noMatchCache = {
				ignored: src.inverted,
				kind: RuleMatchKind.noMatch,
				source: src,
			})
		)
	}

	for (let i = 0; i < elen; i++) {
		const rule = rules[i]!
		const res = cacheTest(rule.compiled!, entry, matchCtx)
		if (res === null) continue
		if (res instanceof Error) {
			return {
				error: res,
				ignored: false,
				kind: RuleMatchKind.invalidExternal,
				pattern: "",
				source: src,
			}
		}

		return {
			ignored: rule.excludes,
			kind: RuleMatchKind.external,
			pattern: res.pattern,
			source: src,
		}
	}

	return {
		ignored: src.inverted,
		kind: RuleMatchKind.noMatch,
		source: src,
	}
}

/**
 * Checks whether a given entry should be ignored based on internal and external patterns.
 * Populates unknown sources using {@link resolveSources}.
 *
 * @since 0.6.0
 */
export function ruleTest(
	options: RuleTestOptions,
	cb: (err: Error | null, match: RuleMatch) => void,
): void {
	try {
		cb(null, ruleTestSync(options))
	} catch (err) {
		cb(err as Error, null as any)
	}
}
