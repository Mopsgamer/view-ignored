/**
 * Matcher options.
 *
 * @since 0.12.0
 */
export const enum MatchMode {
	normal = 0,
	unsensitive = 1 << 0,
	wildmatch = 1 << 1,
	lowered = 1 << 2,
}

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
	 * @since 0.12.0
	 *
	 * @internal
	 */
	meta: any
	/**
	 * The regular expression interface.
	 *
	 * @since 0.6.0
	 */
	re: { test(string: string): boolean }
	/**
	 * The mode this cache was compiled with.
	 *
	 * @since 0.12.0
	 */
	mode: MatchMode
	/**
	 * The original pattern string this cache was compiled from.
	 *
	 * @since 0.6.0
	 */
	pattern: string
	/**
	 * The original pattern list this cache was compiled from.
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
 * Represents a list of positive glob patterns.
 *
 * @since 0.6.0
 */
export type PatternList = string[]
