import type { FsAdapter } from "../types.js"
import type { MatcherContext } from "./matcherContext.js"
import type { Source } from "./source.js"
import type { Target } from "../targets/target.js"

/**
 * Populates a `Source` object from the content of a source file.
 * @see {@link Source.pattern} for more details.
 * @throws Error if extraction fails. Processing stops.
 */
export type ExtractorFn = (source: Source, content: Buffer, ctx: MatcherContext) => void

/**
 * Defines a method for extracting patterns from a specific source file.
 */
export interface Extractor {
	path: string
	extract: ExtractorFn
}

/**
 * Options for finding and extracting patterns from source files.
 * @see {@link resolveSources}
 * @see {@link signedPatternIgnores}
 */
export interface PatternFinderOptions {
	fs: FsAdapter
	ctx: MatcherContext
	cwd: string
	target: Target
	root: string
}
