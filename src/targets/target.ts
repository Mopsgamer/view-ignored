import type { Extractor } from "../patterns/extractor.js"
import type { Ignores, IgnoresCb } from "../patterns/ignores.js"
import type { Init, InitCb } from "../patterns/init.js"
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
	 * Returns `true` if the given file path is an ignore file for this target.
	 *
	 */
	isIgnoreFile: (path: string) => boolean
	/**
	 * Glob-pattern parser.
	 *
	 * @see {@link Ignores}
	 *
	 * @since 0.6.0
	 */
	ignores: Ignores
	/**
	 * @see {@link IgnoresCb}
	 *
	 */
	ignoresCb?: IgnoresCb
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
	/**
	 * @see {@link InitCb}
	 *
	 */
	initCb?: InitCb
}
