import { MatcherStream } from "./patterns/matcherStream.js"
import type { ScanOptions, FsAdapter } from "./types.js"
export type * from "./types.js"

/**
 * @see {@link browserScan}
 *
 * @since 0.6.0
 */
export function scanStream(options: ScanOptions & { fs: FsAdapter; cwd: string }): MatcherStream {
	return new MatcherStream(options)
}
