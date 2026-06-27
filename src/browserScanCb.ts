import type { MatcherContext, Total } from "./patterns/matcherContext.js"
import type { MatcherStream } from "./patterns/matcherStream.js"
import type { Resource } from "./patterns/resource.js"
import type { RuleMatch } from "./patterns/rule.js"
import type { ScanOptions, FsAdapter, ScanBrowserOptions } from "./types.js"

import { scanParallel, type ScanParallelOptions } from "./scanParallel.js"
import { unixify } from "./unixify.js"
import { walkPatchResult, walkPatchTotal, propagateTotals } from "./walk.js"

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
export function browserScanCb(
	options: ScanBrowserOptions,
	cb: (err: Error | null, ctx: MatcherContext) => void,
): void
export function browserScanCb(
	this: MatcherStream | void,
	options: ScanBrowserOptions,
	cb: (err: Error | null, ctx: MatcherContext) => void,
): void {
	const {
		target,
		cwd,
		within = ".",
		invert = false,
		depth: maxDepth = Infinity,
		signal = null,
		skipDepth = false,
		skipInternal = false,
		dirs = true,
		fs: { readdir, readFile, stat },
	} = options

	const fs: FsAdapter = { readFile, readdir, stat }

	if (maxDepth < 0) {
		// oxlint-disable-next-line typescript/no-explicit-any
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
	const normalWithin = unixify(within)

	const scanOptions: Required<ScanOptions> = {
		cwd: normalCwd,
		depth: maxDepth,
		dirs,
		fs,
		invert,
		signal,
		skipDepth,
		skipInternal,
		target,
		within: normalWithin,
	}

	const parallelOptions = <ScanParallelOptions>{
		external: ctx.external,
		failed: ctx.failed,
		onResult: (result) => {
			if ("dir" in result) {
				walkPatchTotal(ctx, scanOptions.depth, result)
				return
			}
			walkPatchResult(ctx, result, scanOptions)
		},
		scanOptions,
		stream: this,
	}

	const parallelHandle = (err: Error | null) => {
		if (err) {
			// oxlint-disable-next-line typescript/no-explicit-any
			cb(err, null as any)
			return
		}
		propagateTotals(ctx.total)
		cb(null, ctx)
	}

	const scanHandle = (err: Error | null) => {
		if (err) {
			// oxlint-disable-next-line typescript/no-explicit-any
			cb(err, null as any)
			return
		}
		scanParallel(parallelOptions, parallelHandle)
	}

	if (target.init) {
		target.init({ cwd: normalCwd, fs, signal, target }, scanHandle)
		return
	}
	scanParallel(parallelOptions, parallelHandle)
}
