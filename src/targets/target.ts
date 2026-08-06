import type { Extractor } from "../patterns/extractor.js"
import type { IgnoresCb } from "../patterns/ignores.js"
import type { InitCb } from "../patterns/init.js"
import type { Rule, InternalRules } from "../patterns/rule.js"

/**
 * Contains the matcher used for scanning.
 *
 * @since 0.6.0
 */
export interface Target {
	/**
	 * Specifies a package.json field name. If defined, the search for ignore files
	 * can extend upwards above the cwd until a package.json containing this field is found.
	 *
	 * @since 0.12.0
	 */
	extendsRoot?: string
	/**
	 * Should be compiled. If an array, it will be treated *high*.
	 *
	 * @since 0.10.0
	 */
	internalRules: Rule[] | InternalRules
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
