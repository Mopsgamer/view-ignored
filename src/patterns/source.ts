import type { SignedPattern } from "./signedPattern.js"

/**
 * Represents a source of patterns for matching paths.
 */
export type Source = {
	/**
	 * Patterns defined within the source file.
	 * Those patterns are for ignoring files.
	 * @see {@link PatternMatcher}
	 * @see {@link signedPatternIgnores}
	 */
	pattern: SignedPattern

	/**
	 * Name of the source file.
	 */
	name: string

	/**
	 * Relative path to the source file.
	 */
	path: string

	/**
	 * Indicates if the matching logic is inverted.
	 * For example, `package.json` `files` field inverts the matching logic,
	 * because it specifies files to include rather than exclude.
	 * @see {@link PatternMatcher}
	 * @see {@link signedPatternIgnores}
	 */
	inverted: boolean

	/**
	 * Error encountered during extraction, if any.
	 * @see {@link ExtractorFn}
	 */
	error?: Error
}

/**
 * Adds a negatable pattern to the source's pattern lists.
 * Strips the leading '!' for include patterns,
 * and adds to exclude patterns otherwise.
 */
export function sourcePushNegatable(source: Source, pattern: string): void {
	let exclude = source.pattern.exclude,
		include = source.pattern.include
	if (source.inverted) {
		;[exclude, include] = [include, exclude]
	}

	let dist = exclude

	if (pattern.startsWith("!")) {
		dist = include
		pattern = pattern.substring(1)
	}

	dist.push(pattern)
}
