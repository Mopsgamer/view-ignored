import type { Ignores } from "../patterns/ignores.js"

/**
 * Contains the matcher used for target scanning.
 */
export interface Target {
	/**
	 * Glob-pattern parser.
	 * @see {@link Ignores}
	 */
	ignores: Ignores
}
