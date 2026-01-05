import type { Target } from "./targets/target.js"
import type { FsAdapter } from "./fs_adapter.js"

export type DepthMode = "files" | undefined

export type ScanOptions = {
	/**
	 * Provides the matcher to use for scanning.
	 */
	target: Target

	/**
	 * Current working directory to start the scan from.
	 * @default `(await import("node:process")).cwd().replaceAll("\\", "/")`
	 */
	cwd?: string

	/**
	 * If enabled, the scan will return files that are ignored by the target matcher.
	 * @default `false`
	 */
	invert?: boolean

	/**
	 * Starting from depth `0` means you will see
	 * children of the current working directory.
	 * @default `Infinity`
	 */
	depth?: number

	/**
	 * Return as soon as possible.
	 * @default `undefined`
	 */
	signal?: AbortSignal

	/**
	 * Requires depth >= 0.
	 * If enabled, directories will be processed faster
	 * by skipping files after first match.
	 * This makes the scan faster but affects
	 * {@link MatcherContext.totalDirs},
	 * {@link MatcherContext.totalFiles},
	 * {@link MatcherContext.totalMatchedFiles}
	 * and {@link MatcherContext.depthPaths}.
	 * @default `false`
	 */
	fastDepth?: boolean

	/**
	 * File system interface.
	 * @default `await import("node:fs")`
	 */
	fs?: FsAdapter
}
