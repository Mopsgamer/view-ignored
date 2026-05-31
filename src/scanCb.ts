import type { MatcherContext, Total } from "./patterns/matcherContext.js"
import type { Resource } from "./patterns/resource.js"
import type { RuleMatch } from "./patterns/rule.js"
import type { ScanBrowserOptions, ScanOptions } from "./types.js"

import { scanParallel } from "./scanParallel.js"
import { unixify } from "./unixify.js"
import { propagateTotals, walkPatchResult, walkPatchTotal } from "./walk.js"

export function scanCb(
	options: ScanBrowserOptions,
	cb: (err: Error | null, ctx: MatcherContext) => void,
): void {
	const {
		target,
		cwd,
		within = ".",
		dirs = false,
		invert = false,
		skipDepth = false,
		skipInternal = false,
		depth: maxDepth = Infinity,
		signal = null,
		fs,
	} = options

	if (maxDepth < 0) return cb(new TypeError("Depth must be a non-negative integer"), null as any)

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
		dirs,
		fs,
		invert,
		signal,
		skipDepth,
		skipInternal,
		target,
		within,
	}

	const startScan = () => {
		scanParallel(
			{
				external: ctx.external,
				failed: ctx.failed,
				onResult: (result) => {
					if ((result as any).type === "total")
						walkPatchTotal(ctx, scanOptions.depth, result as any)
					else {
						const res = result as any
						walkPatchResult(ctx, res, scanOptions.dirs)
						if (res.includeParent && !res.match.ignored && scanOptions.dirs) {
							let parent = res.parentPath
							while (parent) {
								const pPath = parent + "/"
								if (ctx.paths.has(pPath)) break
								ctx.paths.set(pPath, res.match)
								const lastSlash = parent.lastIndexOf("/")
								if (lastSlash === -1) break
								parent = parent.slice(0, lastSlash)
							}
						}
					}
				},
				scanOptions,
				within,
			},
			(err) => {
				if (err) return cb(err, null as any)
				propagateTotals(ctx.total)
				cb(null, ctx)
			},
		)
	}

	if (target.init)
		target.init({ cwd: normalCwd, fs, signal, target }, (err) => {
			if (err) return cb(err, null as any)
			startScan()
		})
	else startScan()
}
