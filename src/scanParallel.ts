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
	const scan1Options = {
		scanOptions,
		stream,
	} as const

	const stack: { relPath: string; parentPath: string }[] = [{ parentPath: ".", relPath: within }]
	let id = 0

	while (stack.length > 0) {
		const { relPath } = stack.pop()!

		const fullPath = join(scanOptions.cwd, relPath)
		const [_, entries] = await Promise.all([
			resolveSources({ ...scanOptions, dir: relPath, external }),
			scanOptions.fs.promises.readdir(fullPath, { withFileTypes: true }),
		])

		for (const entry of entries) {
			const currentRelPath = join(relPath, entry.name)
			const queueItem = queue[id % queue.length]!
			id++

			queueItem.push(id, <WalkOptions>{
				...scan1Options,
				entry,
				external,
				parentPath: relPath,
				relPath: currentRelPath,
			})

			if (entry.isDirectory()) {
				stack.push({ parentPath: relPath, relPath: currentRelPath })
			}
		}
	}
	for (const q of queue) {
		q.done()
	}
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
	let reportedId = -1
	let ids: number[] = []
	return <Q>{
		async cut(failedId) {
			if (failedId === -1) return results
			reportedId = failedId
			await proc.promise
			for (let i = 0; i < ids.length; i++) {
				// TODO: it can be faster
				const id = ids[i]!
				if (id <= reportedId) continue
				return results.slice(0, i)
			}
			return results
		},
		done() {
			isReady = true
			if (pendingCount === 0) proc.resolve({ reportedId: -1, results })
		},
		promise: proc.promise,
		async push(id, o) {
			pendingCount++

			walkIncludes(o)
				.then((res) => {
					results.push(res)
					ids.push(id)
					pendingCount--

					if (isReady && pendingCount === 0) {
						proc.resolve({ reportedId: -1, results })
					}
				})
				.catch(() => {
					reportedId = id
					proc.resolve({ reportedId: id, results })
				})
		},
	}
}
