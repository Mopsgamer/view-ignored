import type { SignedPattern } from "./signedPattern.js"

/**
 * Represents a source of external patterns.
 *
 * @since 0.0.6
 */
export type Source = {
	/**
	 * Patterns defined within the source file.
	 * Those patterns are for ignoring files.
	 *
	 * @see {@link PatternMatcher}
	 * @see {@link signedPatternIgnores}
	 *
	 * @since 0.0.6
	 */
	pattern: SignedPattern

	/**
	 * Name of the source file.
	 *
	 * @since 0.0.6
	 */
	name: string

	/**
	 * Relative path to the source file.
	 *
	 * @since 0.0.6
	 */
	path: string

	/**
	 * Indicates if the matching logic is inverted.
	 * For example, `package.json` `files` field inverts the matching logic,
	 * because it specifies files to include rather than exclude.
	 *
	 * @see {@link PatternMatcher}
	 * @see {@link signedPatternIgnores}
	 *
	 * @since 0.0.6
	 */
	inverted: boolean

	/**
	 * Error encountered during extraction, if any.
	 *
	 * @see {@link ExtractorFn}
	 *
	 * @since 0.0.6
	 */
	error?: Error
}

/**
 * Adds a negatable pattern to the source's pattern lists.
 * Strips the leading '!' for include patterns,
 * and adds to exclude patterns otherwise.
 *
 * @since 0.0.6
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
