import type { MatcherContext } from "../patterns/matcherContext.js"
import type { SignedPatternMatch } from "../patterns/signedPattern.js"
import type { FsAdapter } from "../types.js"

/**
 * Used in {@link Ignores}.
 *
 * @since 0.6.0
 */
export interface IgnoresOptions {
	/**
	 * The file system adapter for directory walking and reading files.
	 *
	 * @since 0.6.0
	 */
	fs: FsAdapter
	/**
	 * @since 0.6.0
	 */
	cwd: string
	/**
	 * File or directory without the slash suffix.
	 *
	 * @since 0.6.0
	 */
	entry: string
	/**
	 * The context to populate.
	 *
	 * @since 0.6.0
	 */
	ctx: MatcherContext
	/**
	 * Return as soon as possible.
	 *
	 * @since 0.7.1
	 */
	signal: AbortSignal | null
}

/**
 * Checks whether a given entry path should be ignored based on its patterns.
 *
 * @see {@link resolveSources}
 * @see {@link signedPatternIgnores}
 * @see {@link https://github.com/Mopsgamer/view-ignored/tree/main/src/targets} for usage examples.
 *
 * @since 0.6.0
 */
export type Ignores = (options: IgnoresOptions) => Promise<SignedPatternMatch>
