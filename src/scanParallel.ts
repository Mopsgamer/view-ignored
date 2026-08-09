import type { MatcherStream } from "./patterns/matcherStream.js"
import type { Resource, InvalidSource } from "./patterns/resource.js"
import type { ScanOptions } from "./types.js"

import { resolveSources } from "./patterns/resolveSources.js"
import { join } from "./unixify.js"
import { walkIncludes, type WalkResult, type WalkTotal } from "./walk.js"

export interface ScanParallelOptions {
	scanOptions: Required<ScanOptions>
	stream?: MatcherStream
	external: Map<string, Resource>
	failed?: InvalidSource[]
	onResult?: (result: WalkResult | WalkTotal) => void
}

/**
 * Executes a parallel directory scan.
 *
 * @since 0.11.0
 */
export function scanParallel(
	options: ScanParallelOptions,
	cb: (err: Error | null, results: WalkResult[] | null) => void,
): void {
	const { scanOptions, stream, external, failed, onResult } = options
	const { within, invert } = scanOptions

	const results: WalkResult[] | null = onResult ? null : []

	let activeTasks = 0
	let errorOccurred: Error | null = null

	const readdirQueue: { relPath: string; depth: number; resource?: Resource }[] = []
	let activeReaddirs = 0
	const CONCURRENCY_LIMIT = 32

	function enqueueWalk(relPath: string, depth: number, resource?: Resource) {
		readdirQueue.push({ depth, relPath, resource })
		processQueue()
	}

	function processQueue() {
		if (errorOccurred) return
		while (activeReaddirs < CONCURRENCY_LIMIT && readdirQueue.length > 0) {
			const task = readdirQueue.shift()!
			activeReaddirs++
			activeTasks++
			runWalk(task.relPath, task.depth, task.resource)
		}
	}

	function runWalk(relPath: string, depth: number, resource?: Resource) {
		if (errorOccurred) return

		scanOptions.fs.readdir(
			join(scanOptions.cwd, relPath),
			{ withFileTypes: true },
			(err, entries) => {
				activeReaddirs--
				processQueue()

				if (err) {
					handleError(err)
					return
				}

				resolveSources(
					{ ...scanOptions, dir: relPath, entries, external, resource },
					(err, res) => {
						if (err) {
							handleError(err)
							return
						}
						if (res && "error" in res && res.error) {
							if (!failed) {
								handleError(res.error)
								return
							}
							failed.push(res)
						}

						const len = entries.length
						const prefix = relPath === "." || relPath === "" ? "" : relPath + "/"

						let pendingResults = len
						let dirFiles = 0
						let dirMatched = 0
						let dirDirs = 0

						if (len === 0 && onResult) {
							onResult({
								depth,
								dir: relPath,
								dirs: 0,
								files: 0,
								ignored: false,
								matched: 0,
							})
						}

						for (let i = 0; i < len; i++) {
							const entry = entries[i]!
							activeTasks++
							const { name } = entry
							const currentRelPath = prefix + name
							const lowerEntry = currentRelPath.toLowerCase()

							walkIncludes(
								{
									depth,
									entry,
									lowerEntry,
									parentPath: relPath,
									relPath: currentRelPath,
									resource: res,
									scanOptions,
									stream,
								},
								(err, self) => {
									if (err) {
										handleError(err)
										return
									}

									if (self && self.match) {
										if (self.isDir) {
											dirDirs++
										} else if (entry.isFile() || entry.isSymbolicLink()) {
											dirFiles++
											const isIncluded =
												invert === true
													? self.match.ignored
													: invert === 2
														? true
														: !self.match.ignored
											if (isIncluded) dirMatched++
										}

										if (onResult) {
											onResult(self)
										} else {
											results!.push(self)
										}

										if (self.isDir && self.next === 0) {
											enqueueWalk(currentRelPath, depth + 1, res)
										}
									}
									pendingResults--
									if (pendingResults === 0 && onResult) {
										onResult({
											depth,
											dir: relPath,
											dirs: dirDirs,
											files: dirFiles,
											ignored: false,
											matched: dirMatched,
										})
									}
									taskDone()
								},
							)
						}
						taskDone()
					},
				)
			},
		)
	}

	function handleError(err: Error) {
		if (!errorOccurred) {
			errorOccurred = err
			// oxlint-disable-next-line typescript/no-explicit-any
			cb(err, null as any)
		}
	}

	function taskDone() {
		activeTasks--
		if (activeTasks === 0 && !errorOccurred) {
			cb(null, results)
		}
	}

	let initialDepth = 0
	if (within !== "." && within !== "") {
		const len = within.length
		for (let i = 0; i < len; i++) {
			if (within.charCodeAt(i) === 47) initialDepth++
		}
	}
	enqueueWalk(within, initialDepth, undefined)
}
