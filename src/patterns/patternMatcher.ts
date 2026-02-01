import type { SignedPattern } from "./signedPattern.js"

/**
 * Combined internal and external patterns for matching.
 *
 * @see {@link signedPatternIgnores}
 */
export type PatternMatcher = {
	internal: SignedPattern
	external: SignedPattern
}
