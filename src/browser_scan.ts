import type { MatcherContext } from "./patterns/matcherContext.js"
import type { ScanOptions, FsAdapter } from "./types.js"

import { scanCb } from "./scanCb.js"
export { scanCb } from "./scanCb.js"
export * from "./types.js"

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
export function scan(
	options: ScanOptions & { fs: FsAdapter; cwd: string },
): Promise<MatcherContext> {
	let resolve!: (ctx: MatcherContext) => void
	let reject!: (err: Error) => void
	const promise = new Promise<MatcherContext>((res, rej) => {
		resolve = res
		reject = rej
	})
	scanCb(options, (err, ctx) => {
		if (err) {
			reject(err)
			return
		}
		resolve(ctx)
	})
	return promise
}
