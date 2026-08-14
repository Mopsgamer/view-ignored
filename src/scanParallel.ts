import type { Dirent } from "node:fs"

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

interface ScanState {
	activeTasks: number
	errorOccurred: Error | null
	results: WalkResult[] | null
}

function processEntries(
	relPath: string,
	depth: number,
	entries: Dirent[],
	res: Resource | null,
	options: ScanParallelOptions,
	state: ScanState,
	walk: (relPath: string, depth: number, resource?: Resource) => void,
	handleError: (err: Error) => void,
	taskDone: () => void,
) {
	const { scanOptions, stream, failed, onResult } = options
	const { invert } = scanOptions

	if (res && "error" in res && res.error) {
		if (!failed) return handleError(res.error)
		failed.push(res)
	}

	const len = entries.length
	const prefix = relPath === "." || relPath === "" ? "" : relPath + "/"

	let pendingResults = len
	let dirFiles = 0
	let dirMatched = 0
	let dirDirs = 0

	if (len === 0 && onResult)
		onResult({ depth, dir: relPath, dirs: 0, files: 0, ignored: false, matched: 0 })

	const handleResult = (self: WalkResult | null, entry: Dirent, currentRelPath: string) => {
		const finish = () => {
			pendingResults--
			if (pendingResults === 0 && onResult) {
				const tot = {
					depth,
					dir: relPath,
					dirs: dirDirs,
					files: dirFiles,
					ignored: false,
					matched: dirMatched,
				}
				onResult(tot)
			}
			taskDone()
		}

		if (!self || !self.match) return finish()

		if (self.isDir) dirDirs++
		else if (entry.isFile() || entry.isSymbolicLink()) {
			dirFiles++
			const isIncluded =
				invert === true ? self.match.ignored : invert === 2 ? true : !self.match.ignored
			if (isIncluded) dirMatched++
		}

		if (onResult) onResult(self)
		else state.results!.push(self)

		if (self.isDir && self.next === 0) walk(currentRelPath, depth + 1, res)
		finish()
	}

	for (let i = 0; i < len; i++) {
		const entry = entries[i]!
		state.activeTasks++
		const { name } = entry
		const currentRelPath = prefix + name

		const selfOrPromise = walkIncludes({
			depth,
			entry,
			parentPath: relPath,
			relPath: currentRelPath,
			resource: res,
			scanOptions,
			stream,
		})

		if (selfOrPromise instanceof Promise) {
			selfOrPromise.then(
				(self) => handleResult(self, entry, currentRelPath),
				(err) => handleError(err),
			)
		} else {
			handleResult(selfOrPromise, entry, currentRelPath)
		}
	}
	taskDone()
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
	const { scanOptions, external, onResult } = options
	const { within } = scanOptions

	const state: ScanState = {
		activeTasks: 0,
		errorOccurred: null,
		results: onResult ? null : [],
	}

	const handleError = (err: Error) => {
		if (!state.errorOccurred) {
			state.errorOccurred = err
			cb(err, null)
		}
	}

	const taskDone = () => {
		state.activeTasks--
		if (state.activeTasks === 0 && !state.errorOccurred) cb(null, state.results)
	}

	const handleReaddir = (
		err: Error | null,
		entries: Dirent[],
		relPath: string,
		depth: number,
		resource?: Resource,
	) => {
		if (err) {
			handleError(err)
			return
		}

		resolveSources({ ...scanOptions, dir: relPath, entries, external, resource }, (err, res) =>
			handleResolveSources(err, res, relPath, depth, entries),
		)
	}

	const handleResolveSources = (
		err: Error | null,
		res: Resource | null,
		relPath: string,
		depth: number,
		entries: Dirent[],
	) => {
		if (err) {
			handleError(err)
			return
		}
		processEntries(relPath, depth, entries, res, options, state, walk, handleError, taskDone)
	}

	const walk = (relPath: string, depth: number, resource?: Resource) => {
		if (state.errorOccurred) return
		state.activeTasks++

		scanOptions.fs.readdir(
			join(scanOptions.cwd, relPath),
			{ withFileTypes: true },
			(err, entries) => handleReaddir(err, entries, relPath, depth, resource),
		)
	}

	let initialDepth = 0
	if (within !== "." && within !== "") {
		const len = within.length
		for (let i = 0; i < len; i++) {
			if (within.charCodeAt(i) === 47) initialDepth++
		}
	}
	walk(within, initialDepth, undefined)
}
