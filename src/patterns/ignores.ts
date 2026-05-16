import type { InitState } from "./initState.js"
import type { Resource } from "./resource.js"
import type { RuleMatch } from "./rule.js"

/**
 * Used in {@link IgnoresCb}.
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
	 * Pre-lowercased entry path.
	 *
	 * @since 0.11.1
	 */
	lowerEntry?: string
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
 * @see {@link IgnoresCb}
 *
 * @since 0.11.0
 */
export type IgnoresCb = (
	options: IgnoresOptions,
	cb: (err: Error | null, match: RuleMatch) => void,
) => void
