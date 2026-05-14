import type { InitState } from "./initState.js"
import type { Resource } from "./resource.js"
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
	 * The associated resource.
	 *
	 * @since 0.11.0
	 */
	resource: Resource
	/**
	 * Result of the `dirname(entry)` call.
	 *
	 * @since 0.10.1
	 */
	parentPath: string
}

/**
 * @see {@link Ignores}
 *
 * @since 0.11.0
 */
export type IgnoresCb = (options: IgnoresOptions, cb: (err: Error | null, match: RuleMatch) => void) => void

/**
 * Checks whether a given entry path should be ignored based on its patterns.
 *
 * @see {@link resolveSources}
 * @see {@link ruleTest}
 * @see {@link https://github.com/Mopsgamer/view-ignored/tree/main/src/targets} for usage examples.
 *
 * @since 0.6.0
 */
export type Ignores = (options: IgnoresOptions) => RuleMatch | Promise<RuleMatch>

/**
 * @see {@link Ignores}
 *
 */
export type IgnoresCb = (options: IgnoresOptions, cb: (err: Error | null, match: RuleMatch) => void) => void
