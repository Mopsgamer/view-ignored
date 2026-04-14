import type { MatcherContext } from "./patterns/matcherContext.js"
import type { MatcherStream } from "./patterns/matcherStream.js"
import type { ScanOptions } from "./types.js"

import { resolveSources } from "./patterns/resolveSources.js"
import { join } from "./unixify.js"
import { walkIncludes, type WalkResult } from "./walk.js"

export interface ScanParallelOptions {
	ctx: MatcherContext
	scanOptions: Required<ScanOptions>
	normalCwd: string
	within: string
	results: WalkResult[]
	stream?: MatcherStream
}

/**
 * Executes a parallel directory scan with a concurrency limit.
 *
 * @since 0.12.0
 */
export async function scanParallel(options: ScanParallelOptions): Promise<void> {
	let { ctx, scanOptions, normalCwd, within, results, stream } = options
	const { fs, signal, target } = scanOptions

	within = within.replace(/^\.\//, "") || "."

	const {
		resolve: resolveScan,
		reject: rejectScan,
		promise: scanFinished,
	} = Promise.withResolvers<void>()

	const queue: (() => void)[] = []
	let runningCount = 0
	let activeTasks = 0
	const limit = 256

	const enqueue = async (place: string, parentPath: string) => {
		if (runningCount >= limit) {
			await new Promise<void>((r) => queue.push(r))
		}
		runningCount++
		try {
			signal?.throwIfAborted()
			await resolveSources({
				external: ctx.external,
				cwd: normalCwd,
				fs,
				signal,
				target,
				dir: parentPath,
			})
			const dir = await fs.promises.opendir(place)
			for await (const entry of dir) {
				signal?.throwIfAborted()
				const fromPath = place + "/" + entry.name
				const path = parentPath === "." ? entry.name : parentPath + "/" + entry.name

				const r = await walkIncludes({
					path,
					entry,
					parentPath,
					external: ctx.external,
					stream,
					scanOptions,
				})

				results.push(r)

				if (r.next === 0 && entry.isDirectory()) {
					activeTasks++
					void enqueue(fromPath, path).catch(rejectScan)
				}
			}
		} catch (e) {
			rejectScan(e)
		} finally {
			runningCount--
			activeTasks--
			if (queue.length > 0) {
				queue.shift()?.()
			} else if (activeTasks === 0) {
				resolveScan()
			}
		}
	}

	activeTasks++
	void enqueue(join(normalCwd, within), within).catch(rejectScan)
	await scanFinished
}
