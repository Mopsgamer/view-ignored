import { gitignoreCompile } from "./gitignore.js"

export type PatternMinimatch = RegExp & {
	/**
	 * The original pattern string used to create this RegExp.
	 */
	context: string
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
