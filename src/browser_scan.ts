import type { ScanOptions, FsAdapter } from "./types.js"
import type { Source } from "./patterns/source.js"
import type { MatcherContext } from "./patterns/matcherContext.js"
import { opendir } from "./opendir.js"
import { walkIncludes } from "./walk.js"
import { populateDirs } from "./populateDirs.js"
import type { SignedPatternMatch } from "./patterns/signedPattern.js"
export type * from "./types.js"

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
export function scan(
	options: ScanOptions & { fs: FsAdapter; cwd: string },
): Promise<MatcherContext> {
	const {
		target,
		cwd,
		invert = false,
		depth: maxDepth = Infinity,
		signal = null,
		fastDepth = false,
		fastInternal = false,
		fs,
	} = options

	if (maxDepth < 0) {
		throw new TypeError("Depth must be a non-negative integer")
	}

	const ctx: MatcherContext = {
		paths: new Map<string, SignedPatternMatch>(),
		external: new Map<string, Source>(),
		failed: [],
		depthPaths: new Map<string, number>(),
		totalFiles: 0,
		totalMatchedFiles: 0,
		totalDirs: 0,
	}

	const normalCwd = cwd.replaceAll("\\", "/").replace(/\w:/, "")

	const scanOptions: Required<ScanOptions> = {
		cwd: normalCwd,
		depth: maxDepth,
		fastDepth,
		fastInternal,
		fs,
		invert,
		signal,
		target,
	}

	const result = opendir(fs, cwd, (entry) =>
		walkIncludes({
			entry,
			ctx,
			stream: undefined,
			scanOptions,
		}),
	)

	return (async (): Promise<MatcherContext> => {
		await result
		populateDirs(signal, ctx)
		return ctx
	})()
}
