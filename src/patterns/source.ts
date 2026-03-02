import type { Rule } from "./rule.js"

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
	 * @see {@link ruleTest}
	 *
	 * @since 0.6.0
	 */
	pattern: Rule[]

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
	 * @see {@link ruleTest}
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
 * Adds a negatable pattern to the source's rules.
 * Strips the leading '!' for include patterns,
 * and adds to exclude patterns otherwise.
 *
 * Expecting the rules
 * to be added into the source and then compiled.
 *
 * @since 0.6.0
 */
export function resolveNegatable(
	pattern: string,
	invert: boolean,
	include: Rule,
	exclude: Rule,
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
