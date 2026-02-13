import { stringCompile, type StringCompileOptions } from "./stringCompile.js"

/**
 * Compiled pattern.
 *
 * @see {@link stringCompile}
 * @see {@link signedPatternCompile}
 *
 * @since 0.6.0
 */
export type PatternMinimatch = {
	re: RegExp
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
	patternContext: Pattern
}

/**
 * Safely calls RegExp.test.
 *
 * @since 0.6.0
 */
export function patternMinimatchTest(pattern: PatternMinimatch, path: string): boolean {
	pattern.re.lastIndex = 0
	return pattern.re.test(path)
}

/**
 * Represents a list of positive minimatch patterns.
 *
 * @since 0.6.0
 */
export type Pattern = string[]

/**
 * Compiles the {@link Pattern}.
 *
 * @see {@link stringCompile}
 * @see {@link signedPatternCompile}
 *
 * @since 0.6.0
 */
export function patternCompile(
	pattern: Pattern,
	options?: StringCompileOptions,
): PatternMinimatch[] {
	return pattern.map((p, _, pattern) => stringCompile(p, pattern, options))
}
