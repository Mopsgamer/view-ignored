import type { Source } from "./source.js"

/**
 * Represents missing source, existing source or invalid source.
 *
 * @since 0.11.0
 */

export type Resource = Source | InvalidSource | "none"
/**
 * Represents a source with an associated error.
 *
 * @since 0.11.0
 */

export type InvalidSource = {
	source: Source
	error: Error
}
