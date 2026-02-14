import { opendir } from "./opendir.js"
import type { MatcherContext } from "./patterns/matcherContext.js"
import { MatcherStream } from "./patterns/matcherStream.js"
import type { SignedPatternMatch } from "./patterns/signedPattern.js"
import type { Source } from "./patterns/source.js"
import type { ScanOptions, FsAdapter } from "./types.js"
import { unixify, relative, join } from "./unixify.js"
import { walkIncludes } from "./walk.js"
export type * from "./types.js"

/**
 * @see {@link browserScan}
 *
 * @since 0.6.0
 */
export function scanStream(options: ScanOptions & { fs: FsAdapter; cwd: string }): MatcherStream {
	const {
		target,
		cwd,
		within = ".",
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

	const normalCwd = unixify(cwd)

	const scanOptions: Required<ScanOptions> = {
		cwd: normalCwd,
		within,
		depth: maxDepth,
		fastDepth,
		fastInternal,
		fs,
		invert,
		signal,
		target,
	}

	void (async (): Promise<void> => {
		await target.init?.({ ctx, cwd, fs, signal })
		let from = join(unixify(normalCwd), within)
		await opendir(fs, from, (entry) => {
			const path = relative(normalCwd, unixify(entry.parentPath) + "/" + entry.name)
			return walkIncludes({
				path,
				entry,
				ctx,
				stream,
				scanOptions,
			})
		})
		stream.emit("end", ctx)
	})()

	return stream
}
