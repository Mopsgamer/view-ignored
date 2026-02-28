import type { MatcherContext } from "./patterns/matcherContext.js"
import type { SignedPatternMatch } from "./patterns/signedPattern.js"
import type { Source } from "./patterns/source.js"
import type { ScanOptions, FsAdapter } from "./types.js"

import { opendir } from "./opendir.js"
import { unixify, relative, join } from "./unixify.js"
import { walkIncludes } from "./walk.js"
export type * from "./types.js"

/**
 * Scan the directory for included files based on the provided targets.
 *
 * Note that this function uses `fs.promises.readFile` and `fs.promises.opendir` without options within
 * custom recursion, instead of `fs.promises.readdir` with `{ withFileTypes: true }.
 * It also normalizes paths to use forward slashes.
 * Please report any issues if you encounter problems related to this behavior.
 *
 * @param options Scan options.
 * @returns A promise that resolves to a {@link MatcherContext} containing the scan results.
 *
 * @since 0.6.0
 */
export function scan(
	options: ScanOptions & { fs: FsAdapter; cwd: string },
): Promise<MatcherContext> {
	const {
		target,
		cwd,
		within = ".",
		invert = false,
		depth: maxDepth = Infinity,
		signal = null,
		fastDepth = false,
		fastInternal = false,
		fs,
	} = options

	if (maxDepth < 0) {
		throw new TypeError("Depth must be a non-negative integer")
	}

	const ctx: MatcherContext = {
		paths: new Map<string, SignedPatternMatch>(),
		external: new Map<string, Source>(),
		failed: [],
		depthPaths: new Map<string, number>(),
		totalFiles: 0,
		totalMatchedFiles: 0,
		totalDirs: 0,
	}

	const normalCwd = unixify(cwd)

	const scanOptions: Required<ScanOptions> = {
		cwd: normalCwd,
		within,
		depth: maxDepth,
		fastDepth,
		fastInternal,
		fs,
		invert,
		signal,
		target,
	}

	return (async (): Promise<MatcherContext> => {
		await target.init?.({ ctx, cwd, fs, signal })
		let from = join(unixify(normalCwd), within)
		await opendir(fs, from, (entry) => {
			const path = relative(normalCwd, unixify(entry.parentPath) + "/" + entry.name)
			return walkIncludes({
				path,
				entry,
				ctx,
				stream: undefined,
				scanOptions,
			})
		})
		return ctx
	})()
}
