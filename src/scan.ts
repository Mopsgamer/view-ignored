import type { MatcherContext } from "./patterns/matcherContext.js"
import type { ScanOptions } from "./types.js"

import * as nodefs from "node:fs"
import * as process from "node:process"

import { scan as browserScan } from "./browser_scan.js"
import { scanCb as browserScanCb } from "./scanCb.js"
export { ScanFlags } from "./types.js"
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
export function scan(options: ScanOptions): Promise<MatcherContext> {
	const { cwd = process.cwd(), fs = nodefs } = options
	return browserScan({ cwd, fs, ...options })
}

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
export function scanCb(
	options: ScanOptions,
	cb: (err: Error | null, ctx: MatcherContext) => void,
): void {
	const { cwd = process.cwd(), fs = nodefs } = options
	browserScanCb({ cwd, fs, ...options }, cb)
}
