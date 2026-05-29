import type { Source } from "./source.js"

import { MatchMode, type PatternCache, type PatternList, patternCacheTest } from "./patternMode.js"

export type Rule = {
	pattern: PatternList
	excludes: boolean
	compiled: null | PatternCache[]
	_literals?: Set<string>
}

export interface RuleMatchBase<K extends string | number | symbol> {
	kind: K
	ignored: boolean
}

export interface RuleMatchBaseSource<K extends string | number | symbol> extends RuleMatchBase<K> {
	source: Source
}

export interface RuleMatchBasePattern<K extends string | number | symbol> extends RuleMatchBase<K> {
	pattern: string
}

export interface RuleMatchBaseError<K extends string | number | symbol> extends RuleMatchBase<K> {
	error: Error
}

export interface RuleMatchBaseInvalidSource<K extends string | number | symbol>
	extends RuleMatchBaseError<K>, RuleMatchBaseSource<K> {}
export interface RuleMatchBaseInvalidPattern<K extends string | number | symbol>
	extends RuleMatchBasePattern<K>, RuleMatchBaseError<K> {}
export interface RuleMatchBaseInvalidExternal<K extends string | number | symbol>
	extends RuleMatchBaseInvalidPattern<K>, RuleMatchBaseSource<K> {}
export interface RuleMatchBaseExternal<K extends string | number | symbol>
	extends RuleMatchBasePattern<K>, RuleMatchBaseSource<K> {}

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

export type RuleMatch =
	| RuleMatchBase<RuleMatchKind.none>
	| RuleMatchBase<RuleMatchKind.missingSource>
	| RuleMatchBaseSource<RuleMatchKind.noMatch>
	| RuleMatchBaseInvalidSource<RuleMatchKind.invalidSource>
	| RuleMatchBaseInvalidExternal<RuleMatchKind.invalidExternal>
	| RuleMatchBaseInvalidPattern<RuleMatchKind.invalidInternal>
	| RuleMatchBaseExternal<RuleMatchKind.external>
	| RuleMatchBasePattern<RuleMatchKind.internal>

export interface RuleTestOptions {
	target: { internalRules: Rule[] }
	resource: Source | null | { error: Error; source: Source }
	entry: string
	lowerEntry?: string
}

function testRule(rule: Rule, entry: string, lower?: string): PatternCache | null {
	const target = lower || entry
	if (rule._literals && rule._literals.has(target)) {
		const rs = rule.compiled!
		for (let i = 0; i < rs.length; i++) if ((rs[i] as any)._simplePattern === target) return rs[i]!
	}

	const rs = rule.compiled
	if (!rs) return null
	const len = rs.length
	for (let i = 0; i < len; i++) {
		const r = rs[i]! as any
		const useLower = !!(r.mode & MatchMode.unsensitive && lower)
		const targetStr = useLower ? lower! : entry

		if (r._isSimple && !(r.mode & MatchMode.wildmatch)) {
			if (r._isLiteral) {
				if (
					targetStr === r._simplePattern ||
					(targetStr.startsWith(r._simplePattern) &&
						targetStr.charCodeAt(r._simplePattern.length) === 47)
				)
					return r
				if (
					!rule.excludes &&
					r._simplePattern.startsWith(targetStr) &&
					(targetStr.charCodeAt(targetStr.length - 1) === 47 ||
						r._simplePattern.charCodeAt(targetStr.length) === 47)
				)
					return r
			} else if (r._isSuffix) {
				if (targetStr.endsWith(r._simplePattern)) {
					if (r._matchBase) return r
					const pos = targetStr.length - r._simplePattern.length
					if (pos === 0 || (r._isRoot ? false : targetStr.charCodeAt(pos - 1) === 47)) return r
				}
			} else if (r._isPrefix) {
				if (targetStr.startsWith(r._simplePattern)) {
					if (r._matchBase) return r
					if (
						targetStr.length === r._simplePattern.length ||
						targetStr.charCodeAt(r._simplePattern.length) === 47
					)
						return r
				} else if (
					!rule.excludes &&
					r._simplePattern.startsWith(targetStr) &&
					(targetStr.charCodeAt(targetStr.length - 1) === 47 ||
						r._simplePattern.charCodeAt(targetStr.length) === 47)
				) {
					return r
				}
			}
		}

		if (patternCacheTest(r, targetStr, useLower ? MatchMode.lowered : MatchMode.normal)) return r
	}
	return null
}

/**
 * Synchronously tests a path against rules.
 *
 * @since 0.11.2
 */
export function ruleTestSync(
	target: { internalRules: Rule[] },
	resource: Source | null | { error: Error; source: Source },
	entry: string,
	lower?: string,
): RuleMatch {
	const src = resource

	if (src !== null && !("error" in src)) {
		const rules = (src as Source).rules
		const rlen = rules.length
		for (let i = 0; i < rlen; i++) {
			const rule = rules[i]!
			const res = testRule(rule, entry, lower)
			if (res) {
				const cache = ((res as any)._matchCache ||= new Map())
				let m = cache.get(rule.excludes)
				if (!m)
					cache.set(
						rule.excludes,
						(m = {
							ignored: rule.excludes,
							kind: RuleMatchKind.external,
							pattern: res.pattern,
							source: src as Source,
						}),
					)
				return m
			}
		}
	}

	const internalRules = target.internalRules
	const ilen = internalRules.length
	for (let i = 0; i < ilen; i++) {
		const rule = internalRules[i]!
		const res = testRule(rule, entry, lower)
		if (res) {
			const cache = ((res as any)._matchCache ||= new Map())
			let m = cache.get(rule.excludes)
			if (!m)
				cache.set(
					rule.excludes,
					(m = { ignored: rule.excludes, kind: RuleMatchKind.internal, pattern: res.pattern }),
				)
			return m
		}
	}

	if (src === null) return { ignored: false, kind: RuleMatchKind.missingSource }
	if ("error" in src) return { ...src, ignored: true, kind: RuleMatchKind.invalidSource } as any

	return ((src as Source)._noMatchCache ||= {
		ignored: (src as Source).inverted,
		kind: RuleMatchKind.noMatch,
		source: src as Source,
	})
}

export function isRuleMatchInvalid(match: RuleMatch): boolean {
	const k = (match as any).kind
	return k >= 3 && k <= 5
}

export function ruleTest(
	options: RuleTestOptions,
	cb: (err: Error | null, match: RuleMatch) => void,
): void {
	try {
		cb(null, ruleTestSync(options.target, options.resource, options.entry, options.lowerEntry))
	} catch (err) {
		cb(err as Error, null as any)
	}
}
