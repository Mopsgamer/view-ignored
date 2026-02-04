import { gitignoreCompile } from "./gitignore.js"

export type PatternMinimatch = RegExp & {
	/**
	 * The original pattern string this minimatch was compiled from.
	 */
	pattern: string
	/**
	 * The original pattern list this pattern was compiled from.
	 */
	patternContext: Pattern
}

export function patternMinimatchTest(pattern: PatternMinimatch, path: string): boolean {
	pattern.lastIndex = 0
	return pattern.test(path)
}

/**
 * Represents a list of positive minimatch patterns.
 */
export type Pattern = string[]

export function patternCompile(pattern: Pattern): PatternMinimatch[] {
	return pattern.map(gitignoreCompile)
}
