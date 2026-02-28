import type { SignedPattern } from "./signedPattern.js"

/**
 * Represents a source of external patterns.
 *
 * @since 0.6.0
 */
export type Source = {
	/**
	 * Patterns defined within the source file.
	 * Those patterns are for ignoring files.
	 *
	 * @see {@link signedPatternIgnores}
	 *
	 * @since 0.6.0
	 */
	pattern: SignedPattern[]

	/**
	 * Name of the source file.
	 *
	 * @since 0.6.0
	 */
	name: string

	/**
	 * Relative path to the source file.
	 *
	 * @since 0.6.0
	 */
	path: string

	/**
	 * Indicates if the matching logic is inverted.
	 * For example, `package.json` `files` field inverts the matching logic,
	 * because it specifies files to include rather than exclude.
	 *
	 * @see {@link signedPatternIgnores}
	 *
	 * @since 0.6.0
	 */
	inverted: boolean

	/**
	 * Error encountered during extraction, if any.
	 *
	 * @see {@link ExtractorFn}
	 *
	 * @since 0.6.0
	 */
	error?: Error
}

/**
 * Adds a negatable pattern to the source's pattern lists.
 * Strips the leading '!' for include patterns,
 * and adds to exclude patterns otherwise.
 *
 * @since 0.6.0
 */
export function sourcePushNegatable(
	pattern: string,
	invert: boolean,
	include: SignedPattern,
	exclude: SignedPattern,
): void {
	if (invert) {
		;[exclude, include] = [include, exclude]
	}

	let dist = exclude

	if (pattern.startsWith("!")) {
		dist = include
		pattern = pattern.substring(1)
	}

	dist.pattern.push(pattern)
}
