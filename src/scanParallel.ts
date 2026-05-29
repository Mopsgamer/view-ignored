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

interface ScanState {
	options: ScanParallelOptions
	cwd: string
	results: WalkResult[] | null
	activeTasks: number
	errorOccurred: Error | null
	cb: (err: Error | null, results: WalkResult[] | null) => void
}

export function scanParallel(
	options: ScanParallelOptions,
	cb: (err: Error | null, results: WalkResult[] | null) => void,
): void {
	const cwd = unixify(options.scanOptions.cwd)
	options.scanOptions.cwd = cwd
	let within = options.within
	if (within.startsWith("./")) within = within.slice(2)

	const state: ScanState = {
		activeTasks: 0,
		cb,
		cwd,
		errorOccurred: null,
		options,
		results: options.onResult ? null : [],
	}

	let initialDepth = 0
	if (within !== "." && within !== "") {
		for (let i = 0, len = within.length; i < len; i++)
			if (within.charCodeAt(i) === 47) initialDepth++
	}

	walk(
		state,
		within,
		initialDepth,
		undefined,
		within === "." || within === "" ? "" : within.toLowerCase(),
	)
}

function handleError(state: ScanState, err: Error) {
	if (!state.errorOccurred) {
		state.errorOccurred = err
		state.cb(err, null)
	}
}

function taskDone(state: ScanState) {
	if (--state.activeTasks === 0 && !state.errorOccurred) {
		state.cb(null, state.results)
	}
}

function walk(
	state: ScanState,
	relPath: string,
	depth: number,
	resource?: Resource,
	lowerRelPath?: string,
) {
	if (state.errorOccurred) return
	state.activeTasks++

	const { scanOptions, external, failed } = state.options
	const absPath = join(state.cwd, relPath)

	scanOptions.fs.readdir(absPath, { withFileTypes: true }, (err, entries) => {
		if (err) return handleError(state, err)

		const targetExtractors = scanOptions.target.extractors
		let hasExtractor = false
		if (targetExtractors.length > 0) {
			const elen = targetExtractors.length
			const nlen = entries.length
			for (let i = 0; i < nlen; i++) {
				const name = entries[i]!.name
				for (let j = 0; j < elen; j++) {
					if (name === targetExtractors[j]!.path) {
						hasExtractor = true
						break
					}
				}
				if (hasExtractor) break
			}
		}

		if (hasExtractor || !resource) {
			resolveSources({ ...scanOptions, dir: relPath, external, resource }, (err, res) => {
				if (err) return handleError(state, err)
				if (res && "error" in res && res.error) {
					if (failed) failed.push(res)
					else return handleError(state, res.error)
				}
				processEntries(state, entries, relPath, depth, res, lowerRelPath)
				taskDone(state)
			})
		} else {
			processEntries(state, entries, relPath, depth, resource, lowerRelPath)
			taskDone(state)
		}
	})
}

function processEntries(
	state: ScanState,
	entries: any[],
	relPath: string,
	depth: number,
	res: Resource | undefined,
	lowerRelPath?: string,
) {
	const len = entries.length
	if (len === 0) {
		if (state.options.onResult)
			state.options.onResult({
				depth,
				dir: relPath,
				dirs: 0,
				files: 0,
				ignored: false,
				matched: 0,
				type: "total",
			})
		return
	}

	const prefix = relPath === "." || relPath === "" ? "" : relPath + "/"
	const lowerPrefix = lowerRelPath ? lowerRelPath + "/" : prefix ? prefix.toLowerCase() : ""
	const { scanOptions, stream, onResult } = state.options

	let pendingResults = len
	let dirFiles = 0
	let dirMatched = 0
	let dirDirs = 0

	for (let i = 0; i < len; i++) {
		const entry = entries[i]!
		const name = entry.name
		const currentRelPath = prefix + name
		const currentLowerRelPath = lowerPrefix + name.toLowerCase()
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
					if (self.isDir) dirDirs++
					else {
						dirFiles++
						if (!self.match.ignored) dirMatched++
					}

					if (onResult) onResult(self)
					else state.results!.push(self)

					if (self.isDir && self.next === 0) {
						walk(state, currentRelPath, depth + 1, res, currentLowerRelPath)
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
