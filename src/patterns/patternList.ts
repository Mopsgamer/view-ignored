import { patternCompile, type PatternCompileOptions } from "./patternCompile.js"

/**
 * Compiled pattern.
 *
 * @see {@link patternCompile}
 * @see {@link ruleCompile}
 *
 * @since 0.6.0
 */
export type PatternCache = {
	/**
	 * The regular expression interface.
	 *
	 * @since 0.6.0
	 */
	re: { test(string: string): boolean }
	/**
	 * The original pattern string this minimatch was compiled from.
	 *
	 * @since 0.6.0
	 */
	pattern: string
	/**
	 * The original pattern list this pattern was compiled from.
	 *
	 * @since 0.6.0
	 */
	patternContext: PatternList
}

/**
 * Safely calls RegExp.test.
 *
 * @since 0.6.0
 */
export function patternCacheTest(cache: PatternCache, path: string): boolean {
	return cache.re.test(path)
}

/**
 * Represents a list of positive minimatch patterns.
 *
 * @since 0.6.0
 */
export type PatternList = string[]

/**
 * Compiles the {@link PatternList}.
 *
 * @see {@link patternCompile}
 * @see {@link ruleCompile}
 *
 * @since 0.6.0
 */
export function patternListCompile(
	list: PatternList,
	options?: PatternCompileOptions,
): PatternCache[] {
	return list.map((p, _, pattern) => patternCompile(p, pattern, options))
}
