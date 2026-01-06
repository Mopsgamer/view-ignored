import type { ScanOptions } from "./types.js"
import type { FsAdapter } from "./fs_adapter.js"
import type { Source } from "./patterns/matcher.js"
import type { MatcherContext } from "./patterns/matcher_context.js"
// oxlint-disable-next-line no-unused-vars
import type { scan as browserScan } from "./browser_scan.js"
import { MatcherStream } from "./patterns/matcher_stream.js"
import { opendir } from "./opendir.js"
import { walk } from "./walk.js"
import { populateDirs } from "./populate_dirs.js"
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
		signal = undefined,
		fastDepth = false,
		fastInternal = false,
		fs,
	} = options

	const ctx: MatcherContext = {
		paths: new Set<string>(),
		external: new Map<string, Source>(),
		failed: false,
		depthPaths: new Map<string, number>(),
		totalFiles: 0,
		totalMatchedFiles: 0,
		totalDirs: 0,
		fs,
	}

	const stream = new MatcherStream({ captureRejections: false })

	const result = opendir(fs, cwd, (entry) =>
		walk({
			entry,
			ctx,
			stream,
			cwd,
			depth: maxDepth,
			fastDepth,
			fastInternal,
			fs,
			invert,
			signal,
			target,
		}),
	)

	void (async (): Promise<void> => {
		await result
		populateDirs(signal, ctx)
		stream.emit("end", ctx)
	})()

	return stream
}
