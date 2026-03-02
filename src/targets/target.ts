import type { Extractor } from "../patterns/extractor.js"
import type { Ignores } from "../patterns/ignores.js"
import type { Init } from "../patterns/init.js"
import type { Rule } from "../patterns/rule.js"

/**
 * Contains the matcher used for scanning.
 *
 * @since 0.6.0
 */
export interface Target {
	/**
	 * Should be compiled.
	 *
	 * @since 0.10.0
	 */
	internalRules: Rule[]
	/**
	 * Initial search directory.
	 * Relative to the `cwd` path or absolute path.
	 *
	 * @since 0.10.0
	 */
	root: string
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
