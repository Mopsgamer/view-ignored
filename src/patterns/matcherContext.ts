import type { SignedPatternMatch } from "./signedPattern.js"
import type { Source } from "./source.js"

/**
 * Post-scan results.
 */
export interface MatcherContext {
	/**
	 * Paths and their corresponding sources.
	 * Directory paths are having the slash suffix.
	 */
	paths: Map<string, SignedPatternMatch>

	/**
	 * Maps directory paths to their corresponding sources.
	 * @example
	 * "dir" => Source
	 * "dir/subdir" => Source
	 */
	external: Map<string, Source | "none">

	/**
	 * If any fatal errors were encountered during source extractions,
	 * this property will contain an array of failed sources.
	 */
	failed: Source[]

	/**
	 * Maps directory paths to the quantity of files they contain.
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
	 */
	depthPaths: Map<string, number>

	/**
	 * Total number of files scanned.
	 */
	totalFiles: number

	/**
	 * Total number of files matched by the target.
	 */
	totalMatchedFiles: number

	/**
	 * Total number of directories scanned.
	 */
	totalDirs: number
}
