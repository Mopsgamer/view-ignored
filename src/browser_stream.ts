import type { ScanBrowserOptions } from "./scan.js"

import { MatcherStream } from "./patterns/matcherStream.js"

/**
 * Scan the directory for included files based on the provided targets.
 *
 * It also normalizes paths to use forward slashes.
 *
 * @param options Scan options.
 * @returns A stream containing the scan results.
 *
 * @since 0.6.0
 */
export function scanStream(options: ScanBrowserOptions): MatcherStream {
	return new MatcherStream(options)
}
