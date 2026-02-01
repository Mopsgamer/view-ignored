import type { Target } from "./targets/target.js"
import type * as fs from "node:fs"
// oxlint-disable-next-line no-unused-vars
import type { MatcherContext } from "./patterns/matcher_context.js"

export interface FsAdapter {
	promises: {
		opendir: typeof fs.promises.opendir
		readFile: typeof fs.promises.readFile
	}
}

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
	 * need precise statistics.
	 * @default `false`
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
	 * @default `false`
	 */
	fastInternal?: boolean

	/**
	 * File system interface.
	 * @default `await import("node:fs")`
	 */
	fs?: FsAdapter
}
