import type { MatcherStream } from "./patterns/matcherStream.js"
import type { ScanBrowserOptions, ScanOptions } from "./types.js"

import * as nodefs from "node:fs"
import * as process from "node:process"

import { scanStream as browserStream } from "./browser_stream.js"
export type * from "./types.js"

const defaultOptions = {
	cwd: process.cwd(),
	fs: { readFile: nodefs.readFile, readdir: nodefs.readdir },
}

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
export function scanStream(options: ScanOptions): MatcherStream {
	options.cwd ??= defaultOptions.cwd
	options.fs ??= defaultOptions.fs
	return browserStream(options as ScanBrowserOptions)
}
