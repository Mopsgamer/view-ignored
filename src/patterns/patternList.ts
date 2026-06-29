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
	re: { test(string: string, lowerPath?: string): boolean }
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
export function patternCacheTest(cache: PatternCache, path: string, lowerPath?: string): boolean {
	return cache.re.test(path, lowerPath)
}

/**
 * Represents a list of positive glob patterns.
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
	options: PatternCompileOptions & { context: PatternList },
): PatternCache[] {
	const len = options.context.length ?? 0
	const res = Array.from<PatternCache>({ length: len })
	for (let i = 0; i < len; i++) {
		res[i] = patternCompile(options.context[i]!, options)
	}
	return res
}
