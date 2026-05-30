import type { PatternFinderOptions } from "./extractor.js"
import type { PatternCache, PatternList } from "./patternMode.js"
import type { Source } from "./source.js"

import { MatchMode, patternCacheTest } from "./patternMode.js"

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

	/**
	 * Internal cache for O(1) literal matching.
	 * @internal
	 */
	_literals?: Set<string>
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
	none,
	missingSource,
	noMatch,
	invalidSource,
	invalidExternal,
	invalidInternal,
	external,
	internal,
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
export function isRuleMatchInvalid(match: RuleMatch): boolean {
	const k = (match as any).kind
	return k >= RuleMatchKind.invalidSource && k <= RuleMatchKind.invalidInternal
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

/**
 * Internal helper to test a single rule against a path.
 */
function testRule(rule: Rule, entry: string, lower?: string): PatternCache | null {
	const target = lower || entry

	if (rule._literals?.has(target)) {
		const rs = rule.compiled!
		for (let i = 0; i < rs.length; i++) {
			if (rs[i]!.meta.simplePattern === target) return rs[i]!
		}
	}

	const rs = rule.compiled
	if (!rs) return null

	for (let i = 0, len = rs.length; i < len; i++) {
		const r = rs[i]!
		const useLower = !!(r.mode & MatchMode.unsensitive && lower)
		const targetStr = useLower ? lower! : entry

		if (r.meta.isSimple && !(r.mode & MatchMode.wildmatch)) {
			const res = testSimpleRule(rule, r, targetStr)
			if (res) return res
		}

		if (patternCacheTest(r, targetStr)) return r
	}
	return null
}

/**
 * Optimizes simple rule matching.
 */
function testSimpleRule(rule: Rule, r: PatternCache, targetStr: string): PatternCache | null {
	if (r.meta.isLiteral) {
		if (
			targetStr === r.meta.simplePattern ||
			(targetStr.startsWith(r.meta.simplePattern) &&
				targetStr.charCodeAt(r.meta.simplePattern.length) === 47)
		) {
			return r
		}
		if (
			!rule.excludes &&
			r.meta.simplePattern.startsWith(targetStr) &&
			(targetStr.charCodeAt(targetStr.length - 1) === 47 ||
				r.meta.simplePattern.charCodeAt(targetStr.length) === 47)
		) {
			return r
		}
		return null
	}

	if (r.meta.isSuffix) {
		if (targetStr.endsWith(r.meta.simplePattern)) {
			if (r.meta.matchBase) return r
			const pos = targetStr.length - r.meta.simplePattern.length
			if (pos === 0 || (r.meta.isRoot ? false : targetStr.charCodeAt(pos - 1) === 47)) {
				return r
			}
		}
		return null
	}

	if (r.meta.isPrefix) {
		if (targetStr.startsWith(r.meta.simplePattern)) {
			if (r.meta.matchBase) return r
			if (
				targetStr.length === r.meta.simplePattern.length ||
				targetStr.charCodeAt(r.meta.simplePattern.length) === 47
			) {
				return r
			}
		} else if (
			!rule.excludes &&
			r.meta.simplePattern.startsWith(targetStr) &&
			(targetStr.charCodeAt(targetStr.length - 1) === 47 ||
				r.meta.simplePattern.charCodeAt(targetStr.length) === 47)
		) {
			return r
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
	if (src === undefined) throw new Error("view-ignored has crashed: no source cached.")

	const entry = options.entry
	const lower = options.lowerEntry

	if (src !== null && !("error" in src)) {
		const rules = (src as Source).rules
		for (let i = 0, len = rules.length; i < len; i++) {
			const rule = rules[i]!
			const res = testRule(rule, entry, lower)
			if (res) return getExternalMatch(src as Source, rule, res)
		}
	}

	const internalRules = options.target.internalRules
	for (let i = 0, len = internalRules.length; i < len; i++) {
		const rule = internalRules[i]!
		const res = testRule(rule, entry, lower)
		if (res) return getInternalMatch(rule, res)
	}

	if (src === null) return { ignored: false, kind: RuleMatchKind.missingSource }
	if ("error" in src) {
		const invalid = src as { error: Error; source: Source }
		return { ...invalid, ignored: true, kind: RuleMatchKind.invalidSource } as any
	}

	const source = src as Source
	return (source._noMatchCache ||= {
		ignored: source.inverted,
		kind: RuleMatchKind.noMatch,
		source,
	})
}

/**
 * Internal helper to create and cache external match results.
 */
function getExternalMatch(src: Source, rule: Rule, res: PatternCache): RuleMatch {
	const cache = ((res as any)._matchCache ||= new Map())
	let m = cache.get(rule.excludes)
	if (!m) {
		m = {
			ignored: rule.excludes,
			kind: RuleMatchKind.external,
			pattern: res.pattern,
			source: src,
		}
		cache.set(rule.excludes, m)
	}
	return m
}

/**
 * Internal helper to create and cache internal match results.
 */
function getInternalMatch(rule: Rule, res: PatternCache): RuleMatch {
	const cache = ((res as any)._matchCache ||= new Map())
	let m = cache.get(rule.excludes)
	if (!m) {
		m = {
			ignored: rule.excludes,
			kind: RuleMatchKind.internal,
			pattern: res.pattern,
		}
		cache.set(rule.excludes, m)
	}
	return m
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
