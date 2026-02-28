import type * as fs from "node:fs"

import type { Target } from "./targets/target.js"

/**
 * Minimal FS implementation needed for `scan`, `scanStream`, and their browser versions.
 *
 * @since 0.6.0
 */
export interface FsAdapter {
	promises: {
		opendir: typeof fs.promises.opendir
		readFile: typeof fs.promises.readFile
	}
}

/**
 * Used in multiple methods, primarily `scan`, `scanStream`, and their browser versions.
 *
 * @since 0.6.0
 */
export type ScanOptions = {
	/**
	 * Provides the matcher to use for scanning.
	 *
	 * @since 0.6.0
	 */
	target: Target

	/**
	 * Current working directory to start the scan from.
	 *
	 * @default `unixify(process.cwd())`
	 *
	 * @since 0.6.0
	 */
	cwd?: string

	/**
	 * Limits the scan to a subdirectory of `cwd`.
	 * Traversal starts from this subdirectory, but returned paths
	 * remain relative to `cwd`, and ignore files from `cwd`
	 * are still applied.
	 *
	 * @default `"."`
	 *
	 * @since 0.6.0
	 */
	within?: string

	/**
	 * If enabled, the scan will return files that are ignored by the target matcher.
	 *
	 * @default `false`
	 *
	 * @since 0.6.0
	 */
	invert?: boolean

	/**
	 * Starting from depth `0` means you will see
	 * children of the current working directory.
	 *
	 * @default `Infinity`
	 *
	 * @since 0.6.0
	 */
	depth?: number

	/**
	 * Return as soon as possible.
	 *
	 * @default `undefined`
	 *
	 * @since 0.6.0
	 */
	signal?: AbortSignal | null

	/**
	 * Works together with {@link ScanOptions.depth}.
	 * If enabled, directories will be processed faster
	 * by skipping files after first match.
	 *
	 * This makes the scan faster but affects
	 * {@link MatcherContext.totalDirs},
	 * {@link MatcherContext.totalFiles},
	 * {@link MatcherContext.totalMatchedFiles}
	 * and {@link MatcherContext.depthPaths}.
	 *
	 * It's recommended to use this option unless you
	 * need precise statistics
	 *
	 * @default `false`
	 *
	 * @since 0.6.0
	 */
	fastDepth?: boolean

	/**
	 * Enables skipping entire directories for internal matches.
	 * For example, when scanning a Git repository,
	 * '.git' directory will be skipped without reading its contents.
	 *
	 * This makes the scan faster but affects
	 * {@link MatcherContext.totalDirs},
	 * {@link MatcherContext.totalFiles},
	 * and {@link MatcherContext.depthPaths}.
	 *
	 * It's recommended to use this option unless the target
	 * allows overriding internal patterns.
	 * This option should never affect {@link MatcherContext.totalMatchedFiles}.
	 *
	 * @default `false`
	 *
	 * @since 0.6.0
	 */
	fastInternal?: boolean

	/**
	 * File system interface.
	 *
	 * @default `await import("node:fs")`
	 *
	 * @since 0.6.0
	 */
	fs?: FsAdapter
}
