import type { MatcherContext, Total } from "./patterns/matcherContext.js"
import type { Resource } from "./patterns/resource.js"
import type { RuleMatch } from "./patterns/rule.js"
import type { ScanOptions, FsAdapter } from "./types.js"

import { scanParallel } from "./scanParallel.js"
import { unixify } from "./unixify.js"
import { walkPatchResult } from "./walk.js"
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
export async function scan(
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
		external: new Map<string, Resource>(),
		failed: [],
		paths: new Map<string, RuleMatch>(),
		total: new Map<string, Total>([[".", { totalDirs: 0, totalFiles: 0, totalMatchedFiles: 0 }]]),
	}

	const normalCwd = unixify(cwd)

	const scanOptions: Required<ScanOptions> = {
		cwd: normalCwd,
		depth: maxDepth,
		fastDepth,
		fastInternal,
		fs,
		invert,
		signal,
		target,
		within,
	}

	await target.init?.({ cwd, fs, signal, target })
	await scanParallel({
		external: ctx.external,
		failed: ctx.failed,
		onResult: (r) => walkPatchResult(ctx, scanOptions.depth, r),
		scanOptions,
		within,
	})
	return ctx
}
