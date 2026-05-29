import type * as fs from "node:fs"

import type { Target } from "./targets/target.js"

/**
 * @since 0.12.0
 */
export const enum ScanFlags {
	none = 0,
	invert = 1 << 0,
	fastDepth = 1 << 1,
	fastInternal = 1 << 2,
	fast = fastDepth | fastInternal,
}

/**
 * Minimal FS implementation needed for `scan`, `scanStream`, and their browser versions.
 *
 * @since 0.6.0
 */
export interface FsAdapter {
	/**
	 * `readdir` is better than `opendir`.
	 */
	readdir: typeof fs.readdir
	readFile: typeof fs.readFile
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
	 * Flags for scanning.
	 * @see {ScanFlags}
	 *
	 * @default `0`
	 *
	 * @since 0.12.0
	 */
	flags?: ScanFlags

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
	 * File system interface.
	 *
	 * @default `await import("node:fs")`
	 *
	 * @since 0.6.0
	 */
	fs?: FsAdapter
}
