import type { MatcherStream } from "./patterns/matcherStream.js"
import type { Resource } from "./patterns/resource.js"
import type { ScanOptions } from "./types.js"

import { resolveSources } from "./patterns/resolveSources.js"
import { join, unixify } from "./unixify.js"
import { walkIncludes, type WalkOptions, type WalkResult } from "./walk.js"

export interface ScanParallelOptions {
	scanOptions: Required<ScanOptions>
	within: string
	results: WalkResult[]
	stream?: MatcherStream
	external: Map<string, Resource>
}

/**
 * Executes a parallel directory scan with a concurrency limit.
 *
 * @since 0.11.0
 */
export async function scanParallel(options: ScanParallelOptions): Promise<WalkResult[]> {
	let { scanOptions, within, results, stream, external } = options
	{
		const cwd = scanOptions.cwd
		scanOptions.cwd = unixify(cwd)
	}

	const queue = Array.from({ length: 4 }, () => makeQ())

	const stack: { relPath: string; parentPath: string }[] = [{ parentPath: ".", relPath: within }]
	let id = 0

	const pushing: Promise<void>[] = []
	while (stack.length > 0) {
		const { relPath, parentPath } = stack.pop()!

		const resolution = resolveSources({ ...scanOptions, dir: relPath, external, parentPath })
		const fullPath = join(scanOptions.cwd, relPath)
		const read = scanOptions.fs.promises.readdir(fullPath, { withFileTypes: true })

		const { resolve: resolveId, promise: promiseId } = Promise.withResolvers<number>()
		pushing.push(
			(async function pushingPush(id, queueItem) {
				const entries = await read
				await resolution
				resolveId(id + entries.length)
				for (let i = 0; i < entries.length; i++) {
					const entry = entries[i]!
					const currentRelPath = join(relPath, entry.name)

					if (entry.isDirectory()) {
						stack.push({ parentPath: relPath, relPath: currentRelPath })
					}

					queueItem.push(id++, <WalkOptions>{
						entry,
						external,
						parentPath: relPath,
						relPath: currentRelPath,
						scanOptions,
						stream,
					})
				}
			})(id, queue[id % queue.length]!),
		)
		id = await promiseId
	}
	for (const q of queue) {
		q.done()
	}
	await Promise.all(pushing)
	let failedId = -1
	for (const q of queue) {
		const result = await q.promise
		if (result.reportedId < 0) {
			continue
		}
		failedId = Math.min(result.reportedId)
	}
	for (const q of queue) {
		results.push(...(await q.cut(failedId)))
	}
	return results
}

interface Q {
	promise: Promise<{ results: WalkResult[]; reportedId: number }>
	push(id: number, o: WalkOptions): Promise<void>
	cut(failedId: number): Promise<WalkResult[]>
	done(): void
}
function makeQ(): Q {
	const proc = Promise.withResolvers<{ results: WalkResult[]; reportedId: number }>()
	const results: WalkResult[] = []
	let pendingCount = 0
	let isReady = false
	let ids: number[] = []
	return <Q>{
		async cut(failedId) {
			if (failedId === -1) return results

			await proc.promise

			let low = 0
			let high = ids.length

			while (low < high) {
				const mid = (low + high) >>> 1
				if (ids[mid]! <= failedId) {
					low = mid + 1
				} else {
					high = mid
				}
			}

			return results.slice(0, low)
		},
		done() {
			isReady = true
			if (pendingCount === 0) proc.resolve({ reportedId: -1, results })
		},
		promise: proc.promise,
		async push(id, o) {
			pendingCount++

			try {
				const res = await walkIncludes(o)
				results.push(res)
			} catch {
				proc.resolve({ reportedId: id, results })
				return
			}
			ids.push(id)
			pendingCount--

			if (isReady && pendingCount === 0) {
				proc.resolve({ reportedId: -1, results })
			}
		},
	}
}
