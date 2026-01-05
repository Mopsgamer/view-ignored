import type { ScanOptions } from "./types.js"
import type { FsAdapter } from "./fs_adapter.js"
import type { Source } from "./patterns/matcher.js"
import type { MatcherContext } from "./patterns/matcher_context.js"
import type { scan as browserScan } from "./browser_scan.js"
import { MatcherStream } from "./patterns/matcher_stream.js"
import { opendir } from "./opendir.js"
import { walk } from "./walk.js"
import { populateDirs } from "./populate_dirs.js"

/**
 * @see {@link browserScan}
 */
export function stream(options: ScanOptions & { fs: FsAdapter; cwd: string }): MatcherStream {
	const {
		target,
		cwd,
		invert = false,
		depth: maxDepth = Infinity,
		signal = undefined,
		fastDepth = false,
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

	const s = new MatcherStream({ captureRejections: false })

	const result = opendir(fs, cwd, (entry) =>
		walk({
			entry,
			ctx,
			s,
			cwd,
			depth: maxDepth,
			fastDepth,
			fs,
			invert,
			signal,
			target,
		}),
	)

	;(async (): Promise<void> => {
		await result
		populateDirs(signal, ctx)
	})()

	return s
}
