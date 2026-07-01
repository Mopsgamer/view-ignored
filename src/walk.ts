import type { Dirent } from "node:fs"

import type { MatcherContext, Total } from "./patterns/matcherContext.js"
import type { MatcherStream } from "./patterns/matcherStream.js"
import type { Resource } from "./patterns/resource.js"
import type { ScanOptions } from "./types.js"

import { getOrInsertComputed } from "./mapUtils.js"
import { isRuleMatchInvalid, type RuleMatch } from "./patterns/rule.js"
import { dirname } from "./unixify.js"

export type WalkOptions = {
	relPath: string
	lowerEntry?: string
	parentPath: string
	entry: Dirent
	resource: Resource
	stream: MatcherStream | undefined
	scanOptions: Required<ScanOptions>
	depth: number
}

export type WalkResult = {
	path: string
	parentPath: string
	match: RuleMatch
	includeParent: boolean
	tooDeep: boolean
	next: 0 | 1
	depth: number
	isDir: boolean
	entry: Dirent
}

export type WalkTotal = {
	dir: string
	files: number
	matched: number
	dirs: number
	depth: number
	ignored: boolean
}

function isMatchExcluded(invert: boolean | 2, match: RuleMatch): boolean {
	return invert === true ? !match.ignored : invert === 2 ? false : match.ignored
}

/**
 * @since 0.11.0
 */
export function walkIncludes(
	options: WalkOptions,
	cb: (err: Error | null, result: WalkResult) => void,
): void {
	const { entry, scanOptions, relPath: path, lowerEntry, parentPath, resource, depth } = options
	const { target, depth: maxDepth, invert, skipDepth, skipInternal, fs, cwd, signal } = scanOptions

	const isDir = entry.isDirectory()

	target.ignores(
		{
			cwd,
			entry: path,
			fs,
			lowerEntry: lowerEntry || path.toLowerCase(),
			parentPath,
			resource,
			signal,
			target,
		},
		(err, match) => {
			// oxlint-disable-next-line typescript/no-explicit-any
			if (err) return cb(err, null as any)

			const tooDeepFlag = skipDepth && depth > maxDepth
			const isExcluded = isMatchExcluded(invert, match)
			const direntPath = isDir ? path + "/" : path

			const result: WalkResult = {
				depth,
				entry,
				includeParent: false,
				isDir,
				match,
				next: 0,
				parentPath,
				path: direntPath,
				tooDeep: tooDeepFlag,
			}

			if (isRuleMatchInvalid(match)) {
				return cb(null, result)
			}

			if (isExcluded) {
				if (isDir && skipInternal) result.next = 1
				return cb(null, result)
			}

			if (tooDeepFlag) {
				result.next = isDir ? 0 : 1
				return cb(null, result)
			}

			if (depth > maxDepth) {
				result.tooDeep = true
				return cb(null, result)
			}

			if (!isDir && parentPath !== "" && parentPath !== ".") {
				result.includeParent = true
			}

			cb(null, result)
		},
	)
}

function patch(
	ctx: MatcherContext,
	stream: MatcherStream | undefined,
	path: string,
	entry: Dirent,
	match: RuleMatch,
): void {
	if (ctx.paths.has(path)) return
	ctx.paths.set(path, match)
	if (stream) {
		stream.dispatchEvent(new CustomEvent("dirent", { detail: { dirent: entry, match, path } }))
	}
}

/**
 * Patches the {@link MatcherContext} with the given result.
 */
export function walkPatchResult(
	ctx: MatcherContext,
	r: WalkResult,
	options: Required<ScanOptions>,
	stream?: MatcherStream,
): void {
	const { match, path, parentPath, tooDeep, includeParent, isDir, entry } = r
	const { dirs, invert } = options

	const isExcluded = isMatchExcluded(invert, match)

	if (isExcluded) {
		if (isRuleMatchInvalid(match) && stream && (dirs || !isDir)) {
			patch(ctx, stream, path, entry, match)
		}
		return
	}

	if (!tooDeep && (dirs || !isDir)) {
		patch(ctx, stream, path, entry, match)
	}

	if (includeParent && dirs) {
		patch(ctx, stream, parentPath + "/", entry, match)
	}
}

function addToTotal(
	total: Map<string, Total>,
	dir: string,
	files: number,
	matched: number,
	dirs: number,
): void {
	const dirTotal = getOrInsertComputed(total, dir, () => ({
		totalDirs: 0,
		totalFiles: 0,
		totalMatchedFiles: 0,
	}))
	dirTotal.totalFiles += files
	dirTotal.totalMatchedFiles += matched
	dirTotal.totalDirs += dirs
}

/**
 * Patches the {@link MatcherContext} with the given total.
 */
export function walkPatchTotal(ctx: MatcherContext, maxDepth: number, t: WalkTotal): void {
	if (t.depth <= maxDepth && !t.ignored) {
		addToTotal(ctx.total, t.dir, t.files, t.matched, t.dirs)
	}
}

/**
 * Propagates totals from child directories to their parents.
 */
export function propagateTotals(total: Map<string, Total>): void {
	if (total.size <= 1) return
	const dirs = Array.from(total.keys()).sort((a, b) => b.length - a.length)
	for (let i = 0, len = dirs.length; i < len; i++) {
		const dir = dirs[i]!
		if (dir === "." || dir === "/") continue
		const dirTotal = total.get(dir)!
		addToTotal(
			total,
			dirname(dir),
			dirTotal.totalFiles,
			dirTotal.totalMatchedFiles,
			dirTotal.totalDirs,
		)
	}
}
