import { gitignoreMatch } from "./gitignore.js"

/**
 * Represents a list of positive minimatch patterns.
 */
export type Pattern = string[]

export function patternMatches(pattern: Pattern, path: string): false | string {
	for (const p of pattern) {
		const matched = gitignoreMatch(p, path)
		if (matched) {
			return p
		}
	}
	return false
}
