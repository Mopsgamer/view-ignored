import type { FsAdapter } from "../types.js"
import type { MatcherContext } from "./matcherContext.js"

/**
 * Used in {@link IgnoresOptions}.
 *
 * @since 0.8.0
 */
export interface InitState {
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
