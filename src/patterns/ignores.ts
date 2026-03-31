import type { InitState } from "./initState.js"
import type { Resource } from "./matcherContext.js"
import type { RuleMatch } from "./rule.js"

/**
 * Used in {@link Ignores}.
 *
 * @since 0.6.0
 */
export interface IgnoresOptions extends InitState {
	/**
	 * File or directory without the slash suffix.
	 *
	 * @since 0.6.0
	 */
	entry: string
	/**
	 * Maps directory paths to their corresponding sources.
	 *
	 * @example
	 * "dir" => Source
	 * "dir/subdir" => Source
	 *
	 * @since 0.11.0
	 */
	external: Map<string, Resource>
	/**
	 * Result of the `dirname(entry)` call.
	 *
	 * @since 0.10.1
	 */
	parentPath: string
}

/**
 * Checks whether a given entry path should be ignored based on its patterns.
 *
 * @see {@link resolveSources}
 * @see {@link ruleTest}
 * @see {@link https://github.com/Mopsgamer/view-ignored/tree/main/src/targets} for usage examples.
 *
 * @since 0.6.0
 */
export type Ignores = (options: IgnoresOptions) => Promise<RuleMatch>
