import type { ScanOptions, FsAdapter } from "./types.js"

import { MatcherStream } from "./patterns/matcherStream.js"
export * from "./types.js"

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
export function scanStream(options: ScanOptions & { fs: FsAdapter; cwd: string }): MatcherStream {
	return new MatcherStream(options)
}
