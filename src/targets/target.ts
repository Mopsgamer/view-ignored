import type { Extractor } from "../patterns/extractor.js"
import type { Ignores } from "../patterns/ignores.js"

/**
 * Contains the matcher used for scanning.
 */
export interface Target {
	/**
	 * The set of extractors.
	 * Required for context-patching APIs (ctx add/remove path).
	 */
	extractors: Extractor[]
	/**
	 * Glob-pattern parser.
	 *
	 * @see {@link Ignores}
	 */
	ignores: Ignores
}
