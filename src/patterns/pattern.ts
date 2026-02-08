import { stringCompile } from "./stringCompile.js"

/**
 * Compiled pattern.
 *
 * @see {@link stringCompile}
 * @see {@link signedPatternCompile}
 */
export type PatternMinimatch = {
	re: RegExp
	/**
	 * The original pattern string this minimatch was compiled from.
	 */
	pattern: string
	/**
	 * The original pattern list this pattern was compiled from.
	 */
	patternContext: Pattern
}

/**
 * Safely calls RegExp.test.
 */
export function patternMinimatchTest(pattern: PatternMinimatch, path: string): boolean {
	pattern.re.lastIndex = 0
	return pattern.re.test(path)
}

/**
 * Represents a list of positive minimatch patterns.
 */
export type Pattern = string[]

/**
 * Compiles the {@link Pattern}.
 *
 * @see {@link stringCompile}
 * @see {@link signedPatternCompile}
 */
export function patternCompile(pattern: Pattern): PatternMinimatch[] {
	return pattern.map(stringCompile)
}
