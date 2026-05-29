import type { MatcherContext, Total } from "./patterns/matcherContext.js"
import type { Resource } from "./patterns/resource.js"
import type { RuleMatch } from "./patterns/rule.js"
import type { FsAdapter, ScanOptions } from "./types.js"

import { scanParallel } from "./scanParallel.js"
import { unixify } from "./unixify.js"
import { propagateTotals, walkPatchResult, walkPatchTotal } from "./walk.js"

export function scanCb(options: ScanOptions & { fs: FsAdapter; cwd: string }, cb: (err: Error | null, ctx: MatcherContext) => void): void {
	const { target, cwd, within = ".", flags = 0, depth: maxDepth = Infinity, signal = null, fs } = options

	if (maxDepth < 0) return cb(new TypeError("Depth must be a non-negative integer"), null as any)

	const ctx: MatcherContext = {
		external: new Map<string, Resource>(),
		failed: [],
		paths: new Map<string, RuleMatch>(),
		total: new Map<string, Total>([[".", { totalDirs: 0, totalFiles: 0, totalMatchedFiles: 0 }]]),
	}

	const normalCwd = unixify(cwd)

	const scanOptions: Required<ScanOptions> = {
		cwd: normalCwd, depth: maxDepth, flags, fs, signal, target, within
	}

	const startScan = () => {
		scanParallel({
			external: ctx.external,
			failed: ctx.failed,
			onResult: (result) => {
				if ((result as any).type === "total") walkPatchTotal(ctx, scanOptions.depth, result as any)
				else walkPatchResult(ctx, result as any)
			},
			scanOptions,
			within,
		}, (err) => {
			if (err) return cb(err, null as any)
			propagateTotals(ctx.total)
			cb(null, ctx)
		})
	}

	if (target.init) target.init({ cwd: normalCwd, fs, signal, target }, (err) => {
		if (err) return cb(err, null as any)
		startScan()
	})
	else startScan()
}
