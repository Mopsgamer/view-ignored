import type { Source } from "./source.js"
import type { SignedPatternMatch } from "./signedPattern.js"

/**
 * The results and stats of a scanning operation.
 */
export interface MatcherContext {
	/**
	 * Paths and their corresponding sources.
	 */
	paths: Map<string, SignedPatternMatch>

	/**
	 * Maps directory paths to their corresponding sources.
	 * @example
	 * "src" => Source
	 */
	external: Map<string, Source>

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
	 * "src/" => 1
	 *
	 * // depth: 1
	 * "src/components/" => 0
	 * "src/views/" => 1
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
