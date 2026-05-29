import type { MatcherStream } from "./patterns/matcherStream.js"
import type { InvalidSource, Resource } from "./patterns/resource.js"
import type { ScanOptions } from "./types.js"
import type { WalkResult, WalkTotal } from "./walk.js"

import { resolveSources } from "./patterns/resolveSources.js"
import { join, unixify } from "./unixify.js"
import { walkIncludes } from "./walk.js"

export interface ScanParallelOptions {
	scanOptions: Required<ScanOptions>
	within: string
	stream?: MatcherStream
	external: Map<string, Resource>
	failed?: InvalidSource[]
	onResult?: (result: WalkResult | WalkTotal) => void
}

export function scanParallel(options: ScanParallelOptions, cb: (err: Error | null, results: WalkResult[] | null) => void): void {
	const { scanOptions, stream, external, failed, onResult } = options
	const cwd = unixify(scanOptions.cwd)
	scanOptions.cwd = cwd
	let within = options.within
	if (within.startsWith("./")) within = within.slice(2)

	const results: WalkResult[] | null = onResult ? null : []

	let activeTasks = 0
	let errorOccurred: Error | null = null

	function handleError(err: Error) {
		if (!errorOccurred) {
			errorOccurred = err
			cb(err, null as any)
		}
	}

	function taskDone() {
		if (--activeTasks === 0 && !errorOccurred) cb(null, results)
	}

	function walk(relPath: string, depth: number, resource?: Resource, lowerRelPath?: string) {
		if (errorOccurred) return
		activeTasks++

		const absPath = join(cwd, relPath)

		scanOptions.fs.readdir(absPath, { withFileTypes: true }, (err, entries) => {
			if (err) return handleError(err)

			const targetExtractors = scanOptions.target.extractors
			let hasExtractor = false
			if (targetExtractors.length > 0) {
				for (let i = 0; i < entries.length; i++) {
					const entryName = entries[i]!.name
					for (let j = 0; j < targetExtractors.length; j++) {
						if (entryName === targetExtractors[j]!.path) {
							hasExtractor = true; break
						}
					}
					if (hasExtractor) break
				}
			}

			if (hasExtractor || !resource) {
				resolveSources({ ...scanOptions, dir: relPath, external, resource }, (err, res) => {
					if (err) return handleError(err)
					if (res && "error" in res && res.error) {
						if (failed) failed.push(res)
						else return handleError(res.error)
					}
					processEntries(entries, relPath, depth, res, lowerRelPath)
					taskDone()
				})
			} else {
				processEntries(entries, relPath, depth, resource, lowerRelPath)
				taskDone()
			}
		})
	}

	function processEntries(entries: any[], relPath: string, depth: number, res: Resource | undefined, lowerRelPath?: string) {
		const len = entries.length
		const prefix = relPath === "." || relPath === "" ? "" : relPath + "/"
		const lowerPrefix = lowerRelPath ? lowerRelPath + "/" : prefix ? prefix.toLowerCase() : ""

		let pendingResults = len
		let dirFiles = 0
		let dirMatched = 0
		let dirDirs = 0

		if (len === 0) {
			if (onResult) onResult({ depth, dir: relPath, dirs: 0, files: 0, ignored: false, matched: 0, type: "total" })
			return
		}

		for (let i = 0; i < len; i++) {
			const entry = entries[i]!
			const name = entry.name
			const currentRelPath = prefix + name
			const currentLowerRelPath = lowerPrefix + name.toLowerCase()
			activeTasks++

			walkIncludes({ depth, entry, lowerRelPath: currentLowerRelPath, parentPath: relPath, relPath: currentRelPath, resource: res as any, scanOptions, stream }, (err, self) => {
				if (err) return handleError(err)

				if (self && self.match) {
					if (self.isDir) dirDirs++
					else {
						dirFiles++
						if (!self.match.ignored) dirMatched++
					}

					if (onResult) onResult(self)
					else results!.push(self)

					if (entry.isDirectory() && self.next === 0) walk(currentRelPath, depth + 1, res, currentLowerRelPath)
				}
				if (--pendingResults === 0) {
					if (onResult) onResult({ depth, dir: relPath, dirs: dirDirs, files: dirFiles, ignored: false, matched: dirMatched, type: "total" })
				}
				taskDone()
			})
		}
	}

	let initialDepth = 0
	if (within !== "." && within !== "") {
		for (let i = 0, len = within.length; i < len; i++) if (within.charCodeAt(i) === 47) initialDepth++
	}
	walk(within, initialDepth, undefined, within === "." || within === "" ? "" : within.toLowerCase())
}
