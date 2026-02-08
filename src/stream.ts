import * as nodefs from "node:fs"
import * as process from "node:process"

import { scanStream as browserStream } from "./browser_stream.js"
import type { MatcherStream } from "./patterns/matcherStream.js"
import type { ScanOptions } from "./types.js"
export type * from "./types.js"

/**
 * @see {@link scan}
 *
 * @since 0.0.6
 */
export function scanStream(options: ScanOptions): MatcherStream {
	const { cwd = process.cwd(), fs = nodefs } = options

	return browserStream({ fs, cwd, ...options })
}
