import type { MatcherStream } from "./patterns/matcherStream.js"
import type { Resource, InvalidSource } from "./patterns/resource.js"
import type { ScanOptions } from "./types.js"

import { resolveSources } from "./patterns/resolveSources.js"
import { join, unixify } from "./unixify.js"
import { walkIncludes, type WalkResult, type WalkTotal } from "./walk.js"

export interface ScanParallelOptions {
	scanOptions: Required<ScanOptions>
	within: string
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
	scanOptions.cwd = unixify(scanOptions.cwd)
	let { within } = options
	if (within.startsWith("./")) within = within.slice(2)

	const results: WalkResult[] | null = onResult ? null : []

	let activeTasks = 0
	let errorOccurred: Error | null = null

	function walk(relPath: string, depth: number, resource?: Resource, lowerRelPath?: string) {
		if (errorOccurred) return
		activeTasks++

		scanOptions.fs.readdir(
			join(scanOptions.cwd, relPath),
			{ withFileTypes: true },
			(err, entries) => {
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
							if (failed) {
								failed.push(res)
							} else {
								handleError(res.error)
								return
							}
						}

						const len = entries.length
						const prefix = relPath === "." || relPath === "" ? "" : relPath + "/"
						const lowerPrefix = lowerRelPath
							? lowerRelPath + "/"
							: prefix
								? prefix.toLowerCase()
								: ""

						let pendingResults = len
						let dirFiles = 0
						let dirMatched = 0
						let dirDirs = 0

						if (len === 0) {
							if (onResult) {
								onResult({
									depth,
									dir: relPath,
									dirs: 0,
									files: 0,
									ignored: false,
									matched: 0,
									type: "total",
								})
							}
						}

						for (let i = 0; i < len; i++) {
							const entry = entries[i]!
							activeTasks++
							const name = entry.name
							const currentRelPath = prefix + name
							const currentLowerRelPath = lowerPrefix + name.toLowerCase()

							walkIncludes(
								{
									depth,
									entry,
									lowerRelPath: currentLowerRelPath,
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
										} else {
											dirFiles++
											if (!self.match.ignored) dirMatched++
										}

										if (onResult) {
											onResult(self)
										} else {
											results!.push(self)
										}

										if (entry.isDirectory() && self.next === 0) {
											walk(currentRelPath, depth + 1, res, currentLowerRelPath)
										}
									}
									pendingResults--
									if (pendingResults === 0) {
										if (onResult) {
											onResult({
												depth,
												dir: relPath,
												dirs: dirDirs,
												files: dirFiles,
												ignored: false,
												matched: dirMatched,
												type: "total",
											})
										}
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
	walk(within, initialDepth, undefined, within === "." || within === "" ? "" : within.toLowerCase())
}
