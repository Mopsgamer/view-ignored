import type { Source } from "./source.js"

/**
 * Represents missing source, existing source or invalid source.
 *
 */

export type Resource = Source | InvalidSource | null
/**
 * Represents a source with an associated error.
 *
 */

export type InvalidSource = {
	source: Source
	error: Error
}
