import type { SignedPattern } from "./signedPattern.js"

/**
 * Combined internal and external patterns for matching.
 *
 * @see {@link signedPatternIgnores}
 *
 * @since 0.6.0
 */
export type PatternMatcher = {
	/**
	 * Internal patterns are provided by the target.
	 * Almost always they are predefined.
	 *
	 * @since 0.6.0
	 */
	internal: SignedPattern[]
	/**
	 * External patterns are sourced from existing project files at runtime.
	 *
	 * @since 0.6.0
	 */
	external: SignedPattern[]
}
