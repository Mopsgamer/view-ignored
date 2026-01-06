import type { MatcherStream } from "./patterns/matcher_stream.js"
import type { ScanOptions } from "./types.js"
// oxlint-disable-next-line no-unused-vars
import type { scan } from "./scan.js"
import { stream as browserStream } from "./browser_stream.js"
import * as nodefs from "node:fs"
import * as process from "node:process"

/**
 * @see {@link scan}
 */
export function stream(options: ScanOptions): MatcherStream {
	const { cwd = process.cwd().replaceAll("\\", "/"), fs = nodefs } = options

	return browserStream({ fs, cwd, ...options })
}
