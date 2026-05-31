import type { MatcherContext } from "./patterns/matcherContext.js"
import type { ScanBrowserOptions } from "./types.js"

import { scanCb } from "./scanCb.js"
export { scanCb } from "./scanCb.js"
export type * from "./types.js"

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
export function scan(options: ScanBrowserOptions): Promise<MatcherContext> {
	const { promise, resolve, reject } = Promise.withResolvers<MatcherContext>()
	scanCb(options, (err, ctx) => {
		if (err) {
			reject(err)
			return
		}
		resolve(ctx)
	})
	return promise
}
