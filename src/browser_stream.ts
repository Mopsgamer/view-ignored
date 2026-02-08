// oxlint-disable-next-line no-unused-vars
import type { scan as browserScan } from "./browser_scan.js"
import { normalizeCwd } from "./normalizeCwd.js"
import { opendir } from "./opendir.js"
import type { MatcherContext } from "./patterns/matcherContext.js"
import { MatcherStream } from "./patterns/matcherStream.js"
import type { SignedPatternMatch } from "./patterns/signedPattern.js"
import type { Source } from "./patterns/source.js"
import type { ScanOptions, FsAdapter } from "./types.js"
import { walkIncludes } from "./walk.js"
export type * from "./types.js"

/**
 * @see {@link browserScan}
 */
export function scanStream(options: ScanOptions & { fs: FsAdapter; cwd: string }): MatcherStream {
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

	const ctx: MatcherContext = {
		paths: new Map<string, SignedPatternMatch>(),
		external: new Map<string, Source>(),
		failed: [],
		depthPaths: new Map<string, number>(),
		totalFiles: 0,
		totalMatchedFiles: 0,
		totalDirs: 0,
	}

	const stream = new MatcherStream({ captureRejections: false })

	const normalCwd = normalizeCwd(cwd)

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
			stream,
			scanOptions,
		}),
	)

	void (async (): Promise<void> => {
		await result
		stream.emit("end", ctx)
	})()

	return stream
}
