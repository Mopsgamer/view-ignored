import * as nodefs from "node:fs"
import * as process from "node:process"

import type { MatcherStream } from "./patterns/matcherStream.js"
import type { ScanOptions } from "./types.js"

import { scanStream as browserStream } from "./browser_stream.js"
export type * from "./types.js"

/**
 * @see {@link scan}
 *
 * @since 0.6.0
 */
export function scanStream(options: ScanOptions): MatcherStream {
	const { cwd = process.cwd(), fs = nodefs } = options

	return browserStream({ fs, cwd, ...options })
}
