import type { SignedPatternMatch } from "./signedPattern.js"
import type { Source } from "./source.js"

/**
 * Post-scan results.
 *
 * @since 0.6.0
 */
export interface MatcherContext {
	/**
	 * Paths and their corresponding sources.
	 * Directory paths are having the slash suffix.
	 *
	 * @since 0.6.0
	 */
	paths: Map<string, SignedPatternMatch>

	/**
	 * Maps directory paths to their corresponding sources.
	 *
	 * @example
	 * "dir" => Source
	 * "dir/subdir" => Source
	 *
	 * @since 0.6.0
	 */
	external: Map<string, Source | "none">

	/**
	 * If any fatal errors were encountered during source extractions,
	 * this property will contain an array of failed sources.
	 *
	 * @since 0.6.0
	 */
	failed: Source[]

	/**
	 * Maps directory paths to the quantity of files they contain.
	 *
	 * @example
	 * // for
	 * "src/"
	 * "src/components/"
	 * "src/views/"
	 * "src/views/index.html"
	 *
	 * // depth: 0
	 * "src" => 1
	 *
	 * // depth: 1
	 * "src/components" => 0
	 * "src/views" => 1
	 *
	 * @since 0.6.0
	 */
	depthPaths: Map<string, number>

	/**
	 * Total number of files scanned.
	 *
	 * @since 0.6.0
	 */
	totalFiles: number

	/**
	 * Total number of files matched by the target.
	 *
	 * @since 0.6.0
	 */
	totalMatchedFiles: number

	/**
	 * Total number of directories scanned.
	 *
	 * @since 0.6.0
	 */
	totalDirs: number
}
