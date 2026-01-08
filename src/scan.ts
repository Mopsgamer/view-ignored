import type { MatcherContext } from "./patterns/matcher_context.js"
import type { ScanOptions } from "./types.d.ts"
import { scan as browserScan } from "./browser_scan.js"
import * as nodefs from "node:fs"
import * as process from "node:process"
export type * from "./types.d.ts"

/**
 * Scan the directory for included files based on the provided targets.
 *
 * Note that this function uses `fs/promises.readFile` and `fs/promises.opendir` without options within
 * custom recursion, instead of `fs.promises.readdir` with `{ withFileTypes: true }.
 * It also normalizes paths to use forward slashes.
 * Please report any issues if you encounter problems related to this behavior.
 *
 * @param options Scan options.
 * @returns A promise that resolves to a {@link MatcherContext} containing the scan results.
 */
export function scan(options: ScanOptions): Promise<MatcherContext> {
	const { cwd = process.cwd().replaceAll("\\", "/"), fs = nodefs } = options

	return browserScan({ fs, cwd, ...options })
}
