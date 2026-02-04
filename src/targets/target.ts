import type { Ignores } from "../patterns/ignores.js"
import type { Extractor } from "../patterns/extractor.js"

/**
 * Contains the matcher used for target scanning.
 */
export interface Target {
	extractors: Extractor[]
	/**
	 * Glob-pattern parser.
	 * @see {@link Ignores}
	 */
	ignores: Ignores
}
