import type { SignedPattern } from "./signedPattern.js"

/**
 * Combined internal and external patterns for matching.
 *
 * @see {@link signedPatternIgnores}
 */
export type PatternMatcher = {
	/**
	 * Internal patterns are provided by the target.
	 * Almost always they are predefined.
	 */
	internal: SignedPattern
	/**
	 * External patterns are sourced from existing project files at runtime.
	 */
	external: SignedPattern
}
