import { stringCompile } from "./stringCompile.js"

/**
 * Compiled pattern.
 *
 * @see {@link stringCompile}
 * @see {@link signedPatternCompile}
 *
 * @since 0.0.6
 */
export type PatternMinimatch = {
	re: RegExp
	/**
	 * The original pattern string this minimatch was compiled from.
	 *
	 * @since 0.0.6
	 */
	pattern: string
	/**
	 * The original pattern list this pattern was compiled from.
	 *
	 * @since 0.0.6
	 */
	patternContext: Pattern
}

/**
 * Safely calls RegExp.test.
 *
 * @since 0.0.6
 */
export function patternMinimatchTest(pattern: PatternMinimatch, path: string): boolean {
	pattern.re.lastIndex = 0
	return pattern.re.test(path)
}

/**
 * Represents a list of positive minimatch patterns.
 *
 * @since 0.0.6
 */
export type Pattern = string[]

/**
 * Compiles the {@link Pattern}.
 *
 * @see {@link stringCompile}
 * @see {@link signedPatternCompile}
 *
 * @since 0.0.6
 */
export function patternCompile(pattern: Pattern): PatternMinimatch[] {
	return pattern.map(stringCompile)
}
