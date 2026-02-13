import type { Extractor } from "../patterns/extractor.js"
import type { Ignores } from "../patterns/ignores.js"
import type { Init } from "../patterns/init.js"

/**
 * Contains the matcher used for scanning.
 *
 * @since 0.6.0
 */
export interface Target {
	/**
	 * The set of extractors.
	 * Required for context-patching APIs (ctx add/remove path).
	 *
	 * @since 0.6.0
	 */
	extractors: Extractor[]
	/**
	 * Glob-pattern parser.
	 *
	 * @see {@link Ignores}
	 *
	 * @since 0.6.0
	 */
	ignores: Ignores
	/**
	 * Initialization function.
	 * Called by the scanner method.
	 *
	 * @example
	 * scan({ target: { ...Git, init: undefined } })
	 *
	 * @see {@link Init}
	 *
	 * @since 0.8.0
	 */
	init?: Init
}
