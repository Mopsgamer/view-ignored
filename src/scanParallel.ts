import type { Dir } from "node:fs"

import type { MatcherStream } from "./patterns/matcherStream.js"
import type { Resource } from "./patterns/resource.js"
import type { ScanOptions } from "./types.js"

import { resolveSources, type ResolveSourcesOptions } from "./patterns/resolveSources.js"
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

	const queue = Array.from({ length: 2 }, () => makeQ())
	let current = 0

	const paths = {
		parentPath: within,
		path: within,
	}
	const rsOptions: ResolveSourcesOptions = Object.assign(
		{
			cwd: scanOptions.cwd,
			dir: paths.parentPath,
			external,
		},
		scanOptions,
	)

	await resolveSources(rsOptions)

	const dirPath = join(scanOptions.cwd, within)
	const dir = await scanOptions.fs.promises.opendir(dirPath)
	const scan1Options = {
		scanOptions,
		stream,
	} as const
	let isRoot = true
	const next: { dir: Dir; paths: { parentPath: string; path: string } }[] = Array.from({
		length: 1000,
	})
	next.push({ dir, paths })
	let id = 0
	for (let e = next.pop(); e !== undefined; isRoot = false, e = next.pop()) {
		for await (const entry of e.dir) {
			paths.path = join(within, isRoot ? entry.name : e.paths.path + "/" + entry.name)
			paths.parentPath = isRoot ? "." : e.paths.path
			const queueItem = queue[current]!
			id++
			if (current === queue.length - 1) current = 0
			else current++

			const walkOptions = Object.assign({}, scan1Options, paths, {
				entry,
				external,
			} as const) satisfies WalkOptions as WalkOptions
			queueItem.push(id, walkOptions)
			// console.log(paths.path)

			if (entry.isDirectory()) {
				rsOptions.dir = paths.path
				const dirPath2 = join(scanOptions.cwd, paths.path)
				const dir = await scanOptions.fs.promises.opendir(dirPath2)
				await resolveSources(rsOptions)
				const n = { dir, paths: Object.assign({}, paths) }
				next.push(n)
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
	const want: WalkOptions[] = []
	const results: WalkResult[] = []
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
			if (want.length === 0) proc.resolve({ reportedId: -1, results })
		},
		promise: proc.promise,
		async push(id, o) {
			if (want.length !== 0) {
				want.push(o)
				return
			}
			try {
				results.push(await walkIncludes(o))
				ids.push(id)
				while (want.length > 0) {
					if (reportedId >= 0 && id > reportedId) break
					results.push(await walkIncludes(want.shift()!))
				}
				if (isReady) proc.resolve({ reportedId: -1, results })
			} catch {
				reportedId = id
				proc.resolve({ reportedId: id, results })
			}
		},
	}
}
