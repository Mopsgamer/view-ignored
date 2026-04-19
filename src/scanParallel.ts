import type { MatcherStream } from "./patterns/matcherStream.js"
import type { Resource } from "./patterns/resource.js"
import type { ScanOptions } from "./types.js"

import { resolveSources } from "./patterns/resolveSources.js"
import { join, unixify } from "./unixify.js"
import { walkIncludes, type WalkResult } from "./walk.js"

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
export function scanParallel(options: ScanParallelOptions): Promise<WalkResult[]> {
	const { scanOptions, within, stream, external } = options
	scanOptions.cwd = unixify(scanOptions.cwd)

	const walk = async (relPath: string, parentPath: string): Promise<WalkResult[]> => {
		const [entries, _] = await Promise.all([
			scanOptions.fs.promises.readdir(join(scanOptions.cwd, relPath), { withFileTypes: true }),
			resolveSources({ ...scanOptions, dir: relPath, external, parentPath }),
		])

		const tasks = entries.map(async (entry): Promise<WalkResult[]> => {
			const currentRelPath = join(relPath, entry.name)

			const result = [
				await walkIncludes({
					entry,
					external,
					parentPath: relPath,
					relPath: currentRelPath,
					scanOptions,
					stream,
				}),
			]

			if (entry.isDirectory()) {
				const children = await walk(currentRelPath, relPath)
				result.push(...children)
				return result
			}

			return result
		})

		const subResults = await Promise.all(tasks)
		return subResults.flat()
	}

	return walk(within, ".")
}
