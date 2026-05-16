import type { MatcherContext, Total } from "./patterns/matcherContext.js"
import type { Resource } from "./patterns/resource.js"
import type { RuleMatch } from "./patterns/rule.js"
import type { ScanOptions, FsAdapter } from "./types.js"

import { scanParallel } from "./scanParallel.js"
import { unixify } from "./unixify.js"
import { walkPatchResult, walkPatchTotal, propagateTotals, type WalkResult } from "./walk.js"

/**
 * Scan the directory for included files based on the provided targets. (Callback version)
 *
 * @param options Scan options.
 * @param cb Callback function.
 *
 * @since 0.11.0
 */
export function scanCb(
	options: ScanOptions & { fs: FsAdapter; cwd: string },
	cb: (err: Error | null, ctx: MatcherContext) => void,
): void {
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
		cb(new TypeError("Depth must be a non-negative integer"), null as any)
		return
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

	const startScan = () => {
		scanParallel(
			{
				external: ctx.external,
				failed: ctx.failed,
				onResult: (result) => {
					if ("dir" in result) {
						walkPatchTotal(ctx, scanOptions.depth, result)
					} else {
						walkPatchResult(ctx, scanOptions.depth, result as WalkResult)
					}
				},
				scanOptions,
				within,
			},
			(err) => {
				if (err) {
					cb(err, null as any)
					return
				}
				propagateTotals(scanOptions.depth, ctx.total)
				cb(null, ctx)
			},
		)
	}

	if (target.init) {
		target.init({ cwd: normalCwd, fs, signal, target }, (err) => {
			if (err) {
				cb(err, null as any)
				return
			}
			startScan()
		})
	} else {
		startScan()
	}
}
