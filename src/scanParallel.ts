import type { MatcherStream } from "./patterns/matcherStream.js"
import type { Resource } from "./patterns/resource.js"
import type { ScanOptions } from "./types.js"

import { resolveSources } from "./patterns/resolveSources.js"
import { join, unixify } from "./unixify.js"
import { walkIncludes, type WalkOptions, type WalkResult } from "./walk.js"

export interface ScanParallelOptions {
	scanOptions: Required<ScanOptions>
	within: string
	stream?: MatcherStream
	external: Map<string, Resource>
}

/**
 * Executes a parallel directory scan with a concurrency limit.
 *
 * @since 0.11.0
 */
export async function scanParallel(options: ScanParallelOptions): Promise<WalkResult[]> {
	const { scanOptions, stream, external } = options
	scanOptions.cwd = unixify(scanOptions.cwd)
	let { within } = options
	if (within.startsWith("./")) within = within.slice(2)

	const readdirOptions = { withFileTypes: true } as const
	const prealloc: WalkOptions = {
		entry: undefined as any,
		parentPath: "",
		relPath: "",
		resource: null as any,
		scanOptions,
		stream,
	}
	const prealloc1 = { ...scanOptions, dir: within, external, parentPath: "." }
	async function walk(relPath: string): Promise<WalkResult[]> {
		const [entries, resource] = await Promise.all([
			scanOptions.fs.promises.readdir(join(scanOptions.cwd, relPath), readdirOptions),
			resolveSources(prealloc1),
		])

		prealloc.parentPath = relPath
		prealloc.resource = resource
		const tasks: Promise<WalkResult[]>[] = entries.map(async function walkTask(entry): Promise<
			WalkResult[]
		> {
			const currentRelPath = join(relPath, entry.name)

			prealloc.entry = entry
			prealloc.relPath = currentRelPath
			const self = walkIncludes(prealloc)

			if (!entry.isDirectory()) {
				return [await self]
			}

			prealloc1.dir = currentRelPath
			prealloc1.parentPath = relPath
			const children = walk(currentRelPath)
			const result = [await self]
			result.push(...(await children))
			return result
		})

		const result = []
		for (const task of tasks) {
			// oxlint-disable-next-line no-await-in-loop
			result.push(...(await task))
		}
		return result
	}

	return await walk(within)
}
