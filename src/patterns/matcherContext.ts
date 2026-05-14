import type { Resource, InvalidSource } from "./resource.js"
import type { RuleMatch } from "./rule.js"

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
	paths: Map<string, RuleMatch>

	/**
	 * Maps directory paths to their corresponding sources.
	 *
	 * @example
	 * "dir" => Source
	 * "dir/subdir" => Source
	 *
	 * @since 0.6.0
	 */
	external: Map<string, Resource>

	/**
	 * If any fatal errors were encountered during source extractions,
	 * this property will contain an array of failed sources.
	 *
	 * @since 0.6.0
	 */
	failed: InvalidSource[]

	/**
	 * Total number of files and directories scanned.
	 *
	 * @example
	 * // for
	 * "src/"
	 * "src/components/"
	 * "src/views/"
	 * "src/views/index.html"
	 *
	 * // depth: 0
	 * "." => { totalFiles: 1, totalMatchedFiles: 1, totalDirs: 3 }
	 * "src" => { totalFiles: 1, totalMatchedFiles: 1, totalDirs: 2 }
	 *
	 * // depth: 1
	 * "src/components" => { totalFiles: 0, totalMatchedFiles: 0, totalDirs: 0 }
	 * "src/views" => { totalFiles: 1, totalMatchedFiles: 1, totalDirs: 0 }
	 *
	 * @since 0.11.0
	 */
	total: Map<string, Total>
}

export interface Total {
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
