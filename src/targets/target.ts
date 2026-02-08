import type { Extractor } from "../patterns/extractor.js"
import type { Ignores } from "../patterns/ignores.js"

/**
 * Contains the matcher used for scanning.
 *
 * @since 0.0.6
 */
export interface Target {
	/**
	 * The set of extractors.
	 * Required for context-patching APIs (ctx add/remove path).
	 *
	 * @since 0.0.6
	 */
	extractors: Extractor[]
	/**
	 * Glob-pattern parser.
	 *
	 * @see {@link Ignores}
	 *
	 * @since 0.0.6
	 */
	ignores: Ignores
}
