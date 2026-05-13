import type { MatcherStream } from "./patterns/matcherStream.js"
import type { Resource, InvalidSource } from "./patterns/resource.js"
import type { ScanOptions } from "./types.js"

import { resolveSources, resolveSourcesCb } from "./patterns/resolveSources.js"
import { join, unixify } from "./unixify.js"
import { walkIncludes, walkIncludesCb, type WalkResult } from "./walk.js"
import { opendir } from "./opendir.js"

export interface ScanParallelOptions {
	scanOptions: Required<ScanOptions>
	within: string
	stream?: MatcherStream
	external: Map<string, Resource>
	failed?: InvalidSource[]
	onResult?: (result: WalkResult) => void
}

/**
 * Executes a parallel directory scan with a concurrency limit.
 *
 * @since 0.11.0
 */
export async function scanParallel(options: ScanParallelOptions): Promise<WalkResult[]> {
	const { scanOptions, stream, external, failed, onResult } = options
	scanOptions.cwd = unixify(scanOptions.cwd)
	let { within } = options
	if (within.startsWith("./")) within = within.slice(2)

	const readdirOptions = { withFileTypes: true } as const

	const results: WalkResult[] = []

	async function walk(relPath: string): Promise<void> {
		const [entries, resource] = await Promise.all([
			scanOptions.fs.promises.readdir(join(scanOptions.cwd, relPath), readdirOptions),
			resolveSources({ ...scanOptions, dir: relPath, external }),
		])
		external.set(relPath, resource)
		if (resource && "error" in resource && resource.error) {
			if (failed) {
				failed.push(resource)
			} else {
				throw resource.error
			}
		}

		const tasks: Promise<void>[] = entries.map(async (entry): Promise<void> => {
			const currentRelPath = join(relPath, entry.name)

			const selfPromise = walkIncludes({
				entry,
				parentPath: relPath,
				relPath: currentRelPath,
				resource,
				scanOptions,
				stream,
			})

			if (!entry.isDirectory()) {
				const self = await selfPromise
				if (onResult) {
					onResult(self)
				} else {
					results.push(self)
				}
				return
			}

			const childrenPromise = walk(currentRelPath)
			const self = await selfPromise
			if (onResult) {
				onResult(self)
			} else {
				results.push(self)
			}
			await childrenPromise
		})

		await Promise.all(tasks)
	}

	await walk(within)
	return results
}

/**
 * Executes a parallel directory scan with a concurrency limit. (Callback version)
 *
 * @since 0.12.0
 */
export function scanParallelCb(
	options: ScanParallelOptions,
	cb: (err: Error | null, results: WalkResult[]) => void,
): void {
	const { scanOptions, stream, external, failed, onResult } = options
	scanOptions.cwd = unixify(scanOptions.cwd)
	let { within } = options
	if (within.startsWith("./")) within = within.slice(2)

	const results: WalkResult[] = []

	let activeTasks = 0
	let errorOccurred: Error | null = null

	function walk(relPath: string) {
		if (errorOccurred) return
		activeTasks++

		resolveSourcesCb({ ...scanOptions, dir: relPath, external }, (err, resource) => {
			if (err) {
				handleError(err)
				return
			}
			external.set(relPath, resource)
			if (resource && "error" in resource && resource.error) {
				if (failed) {
					failed.push(resource)
				} else {
					handleError(resource.error)
					return
				}
			}

			opendir(scanOptions.fs, join(scanOptions.cwd, relPath), (err, entries) => {
				if (err) {
					handleError(err)
					return
				}

				for (const entry of entries) {
					activeTasks++
					const currentRelPath = join(relPath, entry.name)

					walkIncludesCb(
						{
							entry,
							parentPath: relPath,
							relPath: currentRelPath,
							resource,
							scanOptions,
							stream,
						},
						(err, self) => {
							if (err) {
								handleError(err)
								return
							}

							if (onResult) {
								onResult(self)
							} else {
								results.push(self)
							}

							if (entry.isDirectory() && self.next === 0) {
								walk(currentRelPath)
							}
							taskDone()
						},
					)
				}
				taskDone()
			})
		})
	}

	function handleError(err: Error) {
		if (!errorOccurred) {
			errorOccurred = err
			cb(err, null as any)
		}
	}

	function taskDone() {
		activeTasks--
		if (activeTasks === 0 && !errorOccurred) {
			cb(null, results)
		}
	}

	walk(within)
}
