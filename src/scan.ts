import type { MatcherContext } from "./patterns/matcherContext.js"
import type { Target } from "./targets/target.js"

import * as nodefs from "node:fs"
import * as process from "node:process"

import { scan as browserScan } from "./browser_scan.js"
import { browserScanCb } from "./browserScanCb.js"

/**
 * Minimal FS implementation needed for `scan`, `scanStream`, and their browser versions.
 *
 * @since 0.6.0
 */
export interface FsAdapter {
	/**
	 * `readdir` is better than `opendir`.
	 */
	readdir: typeof nodefs.readdir
	readFile: typeof nodefs.readFile
	stat: typeof nodefs.stat
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
	 * Limits the scan to subdirectories or files of `cwd`.
	 * Traversal starts from these subdirectories/files, but returned paths
	 * remain relative to `cwd`, and ignore files from `cwd`
	 * are still applied.
	 *
	 * @default `"."`
	 *
	 * @since 0.6.0
	 */
	within?: string | string[]

	/**
	 * If enabled, the scan will return files that are ignored by the target matcher.
	 *
	 * @default `false`
	 *
	 * @since 0.6.0
	 */
	invert?: boolean | 2

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
	 * and {@link MatcherContext.depthPaths} numbers.
	 *
	 * It's recommended to use this option unless you
	 * care about these stats.
	 *
	 * @default `false`
	 *
	 * @since 0.12.0
	 */
	skipDepth?: boolean

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
	 * allows overriding internal patterns and you don't care about these stats.
	 * This option should never affect {@link MatcherContext.totalMatchedFiles}.
	 *
	 * @default `false`
	 *
	 * @since 0.12.0
	 */
	skipInternal?: boolean

	/**
	 * If disabled, the scan will not return directories.
	 *
	 * @default `true`
	 *
	 * @since 0.12.0
	 */
	dirs?: boolean

	/**
	 * File system interface.
	 *
	 * @default `await import("node:fs")`
	 *
	 * @since 0.6.0
	 */
	fs?: FsAdapter
}

/**
 * Same as {@link ScanOptions}, but with required `fs` and `cwd` properties.
 *
 * @since 0.12.0
 */
export type ScanBrowserOptions = ScanOptions & { fs: FsAdapter; cwd: string }

/**
 * Scan the directory for included files based on the provided targets.
 *
 * It also normalizes paths to use forward slashes.
 *
 * @param options Scan options.
 * @returns A promise that resolves to a {@link MatcherContext} containing the scan results.
 *
 * @since 0.6.0
 */
export function scan(options: ScanOptions): Promise<MatcherContext> {
	const { cwd = process.cwd(), fs = nodefs } = options
	return browserScan({ cwd, fs, ...options })
}

/**
 * Scan the directory for included files based on the provided targets.
 *
 * It also normalizes paths to use forward slashes.
 *
 * @param options Scan options.
 * @param cb Callback function.
 *
 * @since 0.11.0
 */
export function scanCb(
	options: ScanOptions,
	cb: (err: Error | null, ctx: MatcherContext) => void,
): void {
	const { cwd = process.cwd(), fs = nodefs } = options
	browserScanCb({ cwd, fs, ...options }, cb)
}
