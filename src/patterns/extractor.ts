import type { Target } from "../targets/target.js"
import type { FsAdapter } from "../types.js"
import type { Resource } from "./matcherContext.js"
import type { Source } from "./source.js"

/**
 * Populates the source object from the content of a source file.
 * Results are available in `ctx.external`.
 * If `"none"` returned or throwed, will skip the extractor.
 *
 * @see {@link Source.rules} for more details.
 * @throws Error if extraction fails. Processing stops.
 *
 * @since 0.6.0
 */
export type ExtractorFn = (source: Source, content: Buffer) => void | "none"

/**
 * Defines a method for extracting patterns from a specific source file.
 *
 * @since 0.6.0
 */
export interface Extractor {
	/**
	 * Relative path.
	 *
	 * @example
	 * ".gitignore"
	 *
	 * @since 0.6.0
	 */
	path: string
	/**
	 * Populates the source object from the content of a source file.
	 *
	 * @see {@link ExtractorFn}
	 *
	 * @since 0.6.0
	 */
	extract: ExtractorFn
}

/**
 * Options for finding and extracting patterns from source files.
 *
 * @see {@link resolveSources}
 * @see {@link ruleTest}
 *
 * @since 0.6.0
 */
export interface PatternFinderOptions {
	/**
	 * The file system adapter for directory walking and reading files.
	 *
	 * @since 0.6.0
	 */
	fs: FsAdapter
	/**
	 * Maps directory paths to their corresponding sources.
	 *
	 * @example
	 * "dir" => Source
	 * "dir/subdir" => Source
	 *
	 * @since 0.11.0
	 */
	external: Map<string, Resource>
	/**
	 * The current working directory.
	 *
	 * @since 0.6.0
	 */
	cwd: string
	/**
	 * The target implementation.
	 *
	 * @since 0.6.0
	 */
	target: Target
	/**
	 * Return as soon as possible.
	 *
	 * @since 0.7.1
	 */
	signal: AbortSignal | null
}
