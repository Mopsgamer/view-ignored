import type { Extractor } from "../patterns/extractor.js"
import type { IgnoresCb } from "../patterns/ignores.js"
import type { InitCb } from "../patterns/init.js"
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
	 * @see {@link IgnoresCb}
	 *
	 * @since 0.11.0
	 */
	ignores: IgnoresCb
	/**
	 * @see {@link InitCb}
	 *
	 * @since 0.11.0
	 */
	init?: InitCb
}
