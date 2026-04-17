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

	const queue = makeQ(256)

	const stack: { relPath: string; parentPath: string }[] = [{ parentPath: ".", relPath: within }]
	let nextId = 0
	let pendingDiscovery = 0
	const discoveryConcurrency = 4

	const discoveryWorkers: Promise<void>[] = []
	const { promise: discoveryDone, resolve: resolveDiscoveryDone } = Promise.withResolvers<void>()

	const runDiscovery = async () => {
		while (true) {
			const task = stack.pop()
			if (!task) {
				if (pendingDiscovery === 0) {
					break
				}
				// Wait for other workers to potentially add more to the stack
				await new Promise((resolve) => setTimeout(resolve, 1))
				continue
			}

			pendingDiscovery++
			try {
				const { relPath, parentPath } = task

				const resolution = resolveSources({ ...scanOptions, dir: relPath, external, parentPath })
				const fullPath = join(scanOptions.cwd, relPath)
				const entries = await scanOptions.fs.promises.readdir(fullPath, { withFileTypes: true })
				await resolution

				// Assign a block of IDs for this directory's entries
				let id = nextId
				nextId += entries.length

				for (let i = 0; i < entries.length; i++) {
					const entry = entries[i]!
					const currentRelPath = join(relPath, entry.name)

					if (entry.isDirectory()) {
						stack.push({ parentPath: relPath, relPath: currentRelPath })
					}

					queue.push(id++, <WalkOptions>{
						entry,
						external,
						parentPath: relPath,
						relPath: currentRelPath,
						scanOptions,
						stream,
					})
				}
			} finally {
				pendingDiscovery--
				if (pendingDiscovery === 0 && stack.length === 0) {
					resolveDiscoveryDone()
				}
			}
		}
	}

	for (let i = 0; i < discoveryConcurrency; i++) {
		discoveryWorkers.push(runDiscovery())
	}

	await Promise.race([discoveryDone, Promise.all(discoveryWorkers)])
	queue.done()

	const qResult = await queue.promise
	let failedId = qResult.reportedId

	if (failedId === -1) {
		results.push(...qResult.results)
	} else {
		results.push(...(await queue.cut(failedId)))
	}

	return results
}

interface Q {
	promise: Promise<{ results: WalkResult[]; reportedId: number }>
	push(id: number, o: WalkOptions): void
	cut(failedId: number): Promise<WalkResult[]>
	done(): void
}

function makeQ(concurrency: number): Q {
	const proc = Promise.withResolvers<{ results: WalkResult[]; reportedId: number }>()
	const results: WalkResult[] = []
	let pendingCount = 0
	let isReady = false
	let ids: number[] = []

	let active = 0
	const taskQueue: { id: number; o: WalkOptions }[] = []

	const run = async () => {
		if (active >= concurrency || taskQueue.length === 0) {
			return
		}

		active++
		const { id, o } = taskQueue.shift()!

		try {
			const res = await walkIncludes(o)
			results.push(res)
			ids.push(id)
		} catch {
			proc.resolve({ reportedId: id, results })
			return
		} finally {
			active--
			pendingCount--
			if (isReady && pendingCount === 0) {
				proc.resolve({ reportedId: -1, results })
			}
			run()
		}

		// Try to start more tasks if we have capacity
		if (active < concurrency && taskQueue.length > 0) {
			run()
		}
	}

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
		push(id, o) {
			pendingCount++
			taskQueue.push({ id, o })
			run()
		},
	}
}
