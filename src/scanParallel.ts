import type { MatcherStream } from "./patterns/matcherStream.js"
import type { InvalidSource, Resource } from "./patterns/resource.js"
import type { ScanOptions } from "./types.js"
import type { WalkResult, WalkTotal } from "./walk.js"

import { resolveSources } from "./patterns/resolveSources.js"
import { join, unixify } from "./unixify.js"
import { walkIncludes } from "./walk.js"

/**
 * Options for parallel scanning.
 */
export interface ScanParallelOptions {
	/**
	 * Configuration options for the scan.
	 */
	scanOptions: Required<ScanOptions>
	/**
	 * Subdirectory to limit the scan to.
	 */
	within: string
	/**
	 * Optional event emitter for streaming results.
	 */
	stream?: MatcherStream
	/**
	 * Map for caching resolved external sources.
	 */
	external: Map<string, Resource>
	/**
	 * Optional list to collect failed sources.
	 */
	failed?: InvalidSource[]
	/**
	 * Callback for individual path or directory results.
	 */
	onResult?: (result: WalkResult | WalkTotal) => void
}

/**
 * Internal state for a parallel scan operation.
 */
interface ScanState {
	options: ScanParallelOptions
	cwd: string
	results: WalkResult[] | null
	activeTasks: number
	errorOccurred: Error | null
	cb: (err: Error | null, results: WalkResult[] | null) => void
}

/**
 * Performs a parallel directory traversal and matching operation.
 *
 * @since 0.11.0
 */
export function scanParallel(
	options: ScanParallelOptions,
	cb: (err: Error | null, results: WalkResult[] | null) => void,
): void {
	const cwd = unixify(options.scanOptions.cwd)
	options.scanOptions.cwd = cwd

	let within = options.within
	if (within.startsWith("./")) {
		within = within.slice(2)
	}

	const state: ScanState = {
		activeTasks: 0,
		cb,
		cwd,
		errorOccurred: null,
		options,
		results: options.onResult ? null : [],
	}

	const initialDepth = calculateInitialDepth(within)
	const initialLowerRelPath = within === "." || within === "" ? "" : within.toLowerCase()

	walkDirectory(state, within, initialDepth, undefined, initialLowerRelPath)
}

/**
 * Calculates depth of the initial directory.
 */
function calculateInitialDepth(within: string): number {
	if (within === "." || within === "") return 0
	let depth = 0
	for (let i = 0; i < within.length; i++) {
		if (within.charCodeAt(i) === 47) depth++
	}
	return depth
}

/**
 * Handles errors during the scan by failing the entire operation once.
 */
function handleError(state: ScanState, err: Error): void {
	if (!state.errorOccurred) {
		state.errorOccurred = err
		state.cb(err, null)
	}
}

/**
 * Signals completion of a task and triggers the final callback if all tasks are done.
 */
function taskDone(state: ScanState): void {
	state.activeTasks--
	if (state.activeTasks === 0 && !state.errorOccurred) {
		state.cb(null, state.results)
	}
}

/**
 * Initiates a directory walk.
 */
function walkDirectory(
	state: ScanState,
	relPath: string,
	depth: number,
	resource?: Resource,
	lowerRelPath?: string,
): void {
	if (state.errorOccurred) return
	state.activeTasks++

	const { scanOptions } = state.options
	const absPath = join(state.cwd, relPath)

	scanOptions.fs.readdir(absPath, { withFileTypes: true }, (err, entries) => {
		if (err) return handleError(state, err)

		const hasExtractor = checkForExtractors(scanOptions.target.extractors, entries)

		if (hasExtractor || !resource) {
			resolveSources(
				{
					...scanOptions,
					dir: relPath,
					entries: entries as any,
					external: state.options.external,
					resource,
				},
				(err, res) => {
					if (err) return handleError(state, err)
					handleSourceResolution(state, entries as any, relPath, depth, res, lowerRelPath)
					taskDone(state)
				},
			)
		} else {
			processEntries(state, entries as any, relPath, depth, resource, lowerRelPath)
			taskDone(state)
		}
	})
}

/**
 * Checks if any entries in a directory match the target's source file extractors.
 */
function checkForExtractors(extractors: any[], entries: any[]): boolean {
	const elen = extractors.length
	if (elen === 0) return false

	const nlen = entries.length
	for (let i = 0; i < nlen; i++) {
		const name = entries[i]!.name
		for (let j = 0; j < elen; j++) {
			if (name === extractors[j]!.path) return true
		}
	}
	return false
}

/**
 * Handles the result of source resolution before processing entries.
 */
function handleSourceResolution(
	state: ScanState,
	entries: any[],
	relPath: string,
	depth: number,
	res: Resource | undefined,
	lowerRelPath?: string,
): void {
	if (res && "error" in res && res.error) {
		if (state.options.failed) {
			state.options.failed.push(res)
		} else {
			handleError(state, res.error)
			return
		}
	}
	processEntries(state, entries, relPath, depth, res, lowerRelPath)
}

/**
 * Iterates through directory entries and tests them against rules.
 */
function processEntries(
	state: ScanState,
	entries: any[],
	relPath: string,
	depth: number,
	res: Resource | undefined,
	lowerRelPath?: string,
): void {
	const len = entries.length
	if (len === 0) {
		if (state.options.onResult) {
			state.options.onResult({
				depth,
				dir: relPath,
				dirs: 0,
				files: 0,
				ignored: false,
				matched: 0,
				type: "total",
			})
		}
		return
	}

	const prefix = relPath === "." || relPath === "" ? "" : relPath + "/"
	const lowerPrefix = lowerRelPath ? lowerRelPath + "/" : prefix.toLowerCase()
	const { scanOptions, stream, onResult } = state.options

	let pendingResults = len
	let dirFiles = 0
	let dirMatched = 0
	let dirDirs = 0

	for (let i = 0; i < len; i++) {
		const entry = entries[i]!
		const currentRelPath = prefix + entry.name
		const currentLowerRelPath = lowerPrefix + entry.name.toLowerCase()
		state.activeTasks++

		walkIncludes(
			{
				depth,
				entry,
				lowerRelPath: currentLowerRelPath,
				parentPath: relPath,
				relPath: currentRelPath,
				resource: res as any,
				scanOptions,
				stream,
			},
			(err, self) => {
				if (err) return handleError(state, err)

				if (self && self.match) {
					if (self.isDir) {
						dirDirs++
					} else {
						dirFiles++
						if (!self.match.ignored) dirMatched++
					}

					if (onResult) onResult(self)
					else state.results!.push(self)

					if (self.isDir && self.next === 0) {
						walkDirectory(state, currentRelPath, depth + 1, res, currentLowerRelPath)
					}
				}

				if (--pendingResults === 0 && onResult) {
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
				taskDone(state)
			},
		)
	}
}
