import type { Dirent } from "node:fs"

import type { PatternFinderOptions } from "./extractor.js"
import type { IgnoresOptions } from "./ignores.js"
import type { MatcherContext } from "./matcherContext.js"
import type { Resource } from "./resource.js"
import type { Source } from "./source.js"

import { type PatternList } from "./patternList.js"

/**
 * @since 0.12.0
 */
export type InternalRules = {
	/**
	 * Tested before external (source's) rules.
	 *
	 * @since 0.12.0
	 */
	before: Rule[]
	/**
	 * Tested after external (source's) rules.
	 * Overridable by external rules.
	 *
	 * @since 0.12.0
	 */
	after: Rule[]
}

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
export type GlobRule = {
	/**
	 * Provides ignored or included file and directory patterns.
	 *
	 * @see {@link ruleTest} provides the ignoring algorithm.
	 *
	 * @since 0.11.0
	 */
	list: PatternList
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
	compiled: null | {
		re: { test(string: string, lowerPath?: string): boolean }
		pattern: string
		list: PatternList
		compiledItems?: { pattern: string; re: RegExp }[]
	}
}

export type CustomRule = {
	/**
	 * Applies when `match(path)` returns `string`.
	 * If `true`, path is ignored.
	 *
	 * @since 0.12.0
	 */
	excludes: boolean
	/**
	 * Custom match function.
	 *
	 * @returns The pattern, matching error or null.
	 * It could be `boolean | Error`, but we use `string | null | Error`.
	 * `string` gives us ability to tell why the path is ignored.
	 * User decides what to do with the string, not view-ignored.
	 *
	 * @example
	 *   match(o) {
	 *     if (o.dirent.isSymlink()) {
	 *       // ignores symlinks
	 *       return "//symlink"
	 *     }
	 *     if (o.includes("hi")) {
	 *       return "*hi*" || ("**"+"/*hi*") || "//includes 'hi'"
	 *     }
	 *     if (patternListCompile({ list: ["*hi*"] })) {
	 *       // btw, do not compile inside match, it's slow
	 *       return "*hi*"
	 *     }
	 *     return null
	 *   }
	 *
	 * @example
	 *   // Some standandized examples
	 *
	 *   // message or glob
	 *   return "//starts with 's' && !ends with 't'"
	 *   return "s*[!t]" // can be used instead of "**"+"/s*[!t]"
	 *
	 *   // some other messages
	 *   return "//has 't'"
	 *   return "//!has 't'"
	 *   return "//has 't' at 1"
	 *   return "//base has 't'"
	 *   return "//dirname has 't'"
	 *   return "//dirname base has 't'"
	 *
	 * @since 0.12.0
	 */
	match: (options: IgnoresOptions) => string | Error | null
}

/**
 * Represents a rule that allows skipping directory scanning.
 * It is a functional rule that can return a `MatcherContext` or a `Promise` resolving to one,
 * or `null` if the rule does not apply.
 *
 * @since 0.12.0
 */
export type SkipRule = (
	options: IgnoresOptions,
) => MatcherContext | Promise<MatcherContext | null> | null

/**
 * Represents any supported target rule, which can be a glob-based rule,
 * a custom matching rule, or a directory skipping rule.
 *
 * @since 0.6.0
 */
export type Rule = GlobRule | CustomRule | SkipRule

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
	source: Source | null
}

/**
 * @see {@link RuleMatch}
 *
 * @since 0.9.1
 */
export interface RuleMatchBasePattern<K extends string | number | symbol> extends RuleMatchBase<K> {
	pattern: unknown
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
	 * Result of the `dirname(entry)` call.
	 *
	 * @since 0.12.0
	 */
	parentPath: string

	/**
	 * Pre-lowercased entry path.
	 *
	 * @since 0.11.0
	 */
	lowerEntry?: string

	/**
	 * The filesystem entry's Dirent representation if available.
	 *
	 * @since 0.12.0
	 */
	dirent: Dirent
}

function cacheTest(
	rs: {
		re: { test(string: string, lowerPath?: string): boolean }
		pattern: string
		list: PatternList
		compiledItems?: { pattern: string; re: RegExp }[]
	} | null,
	path: string,
	lowerPath?: string,
): { pattern: string } | null {
	if (!rs) return null
	const n = lowerPath || path
	if (!rs.re.test(path, lowerPath)) return null
	const items = rs.compiledItems
	if (items) {
		const len = items.length
		for (let i = 0; i < len; i++) {
			const item = items[i]!
			if (item.re.test(n)) return { pattern: item.pattern }
		}
	}
	return { pattern: rs.pattern }
}

/**
 * Synchronous version of {@link ruleTest}.
 *
 * @since 0.11.0
 */
export function ruleTestSync(options: RuleTestOptions): RuleMatch {
	const src = options.resource

	if (src === undefined) throw new Error("view-ignored has crashed: no source cached.")

	if (src !== null && "error" in src)
		return { ...src, ignored: true, kind: RuleMatchKind.invalidSource }

	const { entry } = options
	const lowerPath = options.lowerEntry || entry.toLowerCase()

	const { internalRules } = options.target
	const beforeInternal = Array.isArray(internalRules) ? internalRules : internalRules.before

	const ignoreOptions: IgnoresOptions = {
		cwd: options.cwd,
		dirent: options.dirent,
		entry,
		fs: options.fs,
		lowerEntry: lowerPath,
		parentPath: options.parentPath,
		resource: src,
		signal: options.signal,
		target: options.target,
	}

	if (beforeInternal.length > 0) {
		const internalMatch = ruleTestInternalSync(beforeInternal, ignoreOptions)
		if (internalMatch) return internalMatch
	}

	let currentSrc: Resource = src
	let runner: Resource | null = src
	let hasInverted = false
	while (currentSrc !== null && !("error" in currentSrc)) {
		if (runner !== null && !("error" in runner)) {
			runner = runner.parent ?? null
			if (runner !== null && !("error" in runner)) {
				runner = runner.parent ?? null
			}
		}
		if (runner === currentSrc && currentSrc !== null) {
			console.error("CYCLE DETECTED in currentSrc.parent chain! currentSrc path:", currentSrc.path)
			break
		}
		if (currentSrc.inverted) hasInverted = true
		const { rules } = currentSrc
		const rlen = rules.length

		for (let i = 0; i < rlen; i++) {
			const rule = rules[i]!
			if (typeof rule === "function") continue
			const res =
				"match" in rule ? rule.match(ignoreOptions) : cacheTest(rule.compiled!, entry, lowerPath)
			if (res === null) continue
			if (res instanceof Error) {
				return {
					error: res,
					ignored: false,
					kind: RuleMatchKind.invalidExternal,
					pattern: "",
					source: currentSrc,
				}
			}

			return {
				ignored: rule.excludes,
				kind: RuleMatchKind.external,
				pattern: typeof res === "string" ? res : res.pattern,
				source: currentSrc,
			}
		}

		currentSrc = currentSrc.parent ?? null
	}

	if (!Array.isArray(internalRules)) {
		const afterInternal = internalRules.after
		if (afterInternal.length > 0) {
			const internalMatch = ruleTestInternalSync(afterInternal, ignoreOptions)
			if (internalMatch) return internalMatch
		}
	}

	if (src === null) return { ignored: false, kind: RuleMatchKind.missingSource }

	return (src._noMatchCache ||= {
		ignored: hasInverted || src.inverted || false,
		kind: RuleMatchKind.noMatch,
		source: src,
	})
}

function ruleTestInternalSync(rules: Rule[], options: IgnoresOptions): RuleMatch | void {
	for (let i = 0, len = rules.length; i < len; i++) {
		const rule = rules[i]!
		if (typeof rule === "function") continue
		const res =
			"match" in rule
				? rule.match(options)
				: cacheTest(rule.compiled!, options.entry, options.lowerEntry)
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
			pattern: typeof res === "string" ? res : res.pattern,
		}
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
		// oxlint-disable-next-line typescript/no-explicit-any
		cb(err as Error, null as any)
	}
}
