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
	context: MatcherContext | null | undefined
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
	const {
		target,
		depth: maxDepth,
		invert,
		skipDepth,
		skipInternal,
		fs,
		cwd,
		signal,
		within,
	} = scanOptions

	const isDir = entry.isDirectory()

	const runIgnores = () => {
		target.ignores(
			{
				cwd,
				depth: maxDepth - depth,
				dirent: entry,
				entry: path,
				fs,
				lowerEntry: lowerEntry || path.toLowerCase(),
				parentPath,
				resource,
				signal,
				target,
				within: skipInternal ? undefined : within,
			},
			(err, match) => {
				// oxlint-disable-next-line typescript/no-explicit-any
				if (err) return cb(err, null as any)

				const tooDeepFlag = skipDepth && depth > maxDepth
				const isExcluded = isMatchExcluded(invert, match)
				const direntPath = isDir ? path + "/" : path

				const result: WalkResult = {
					context: undefined,
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

				if (isDir && skipInternal && match.ignored) {
					result.next = 1
				}

				if (isExcluded) {
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

	if (!isDir) {
		runIgnores()
		return
	}

	const internalRules = target.internalRules
	const rules = internalRules
		? Array.isArray(internalRules)
			? internalRules
			: [...(internalRules.before || []), ...(internalRules.after || [])]
		: []
	const len = rules.length
	for (let i = 0; i < len; i++) {
		const rule = rules[i]!
		if (typeof rule !== "function") continue

		const ignoreOptions = {
			cwd,
			depth: maxDepth - depth,
			dirent: entry,
			entry: path,
			fs,
			lowerEntry: lowerEntry || path.toLowerCase(),
			parentPath,
			resource,
			signal,
			target,
			within,
		}
		const res = rule(ignoreOptions)
		if (res === null) continue

		if (res && typeof (res as Promise<unknown>).then === "function") {
			;(res as Promise<MatcherContext | null>).then(
				(resolvedCtx) => {
					if (resolvedCtx === null) {
						runIgnores()
						return
					}
					cb(null, {
						context: resolvedCtx,
						depth,
						entry,
						includeParent: false,
						isDir: true,
						match: { ignored: true, kind: 0 },
						next: 1,
						parentPath,
						path: path + "/",
						tooDeep: false,
					})
				},
				(err) => {
					// oxlint-disable-next-line typescript/no-explicit-any
					cb(err as Error, null as any)
				},
			)
			return
		}
		cb(null, {
			context: res as MatcherContext,
			depth,
			entry,
			includeParent: false,
			isDir: true,
			match: { ignored: true, kind: 0 },
			next: 1,
			parentPath,
			path: path + "/",
			tooDeep: false,
		})
		return
	}

	runIgnores()
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

function patchMerged(
	ctx: MatcherContext,
	stream: MatcherStream | undefined,
	mergedCtx: MatcherContext,
): void {
	for (const [p, m] of mergedCtx.paths) {
		if (ctx.paths.has(p)) continue
		ctx.paths.set(p, m)
		if (!stream) continue

		const isDir = p.endsWith("/")
		const cleanPath = isDir ? p.slice(0, -1) : p
		const lastSlash = cleanPath.lastIndexOf("/")
		const parentPath = lastSlash === -1 ? "." : cleanPath.slice(0, lastSlash)
		const name = lastSlash === -1 ? cleanPath : cleanPath.slice(lastSlash + 1)
		const mockEntry = {
			isBlockDevice: () => false,
			isCharacterDevice: () => false,
			isDirectory: () => isDir,
			isFIFO: () => false,
			isFile: () => !isDir,
			isSocket: () => false,
			isSymbolicLink: () => false,
			name,
			parentPath,
		} as Dirent
		stream.dispatchEvent(
			new CustomEvent("dirent", { detail: { dirent: mockEntry, match: m, path: p } }),
		)
	}
	for (const [p, r] of mergedCtx.external) {
		ctx.external.set(p, r)
	}
	if (mergedCtx.failed.length > 0) {
		ctx.failed.push(...mergedCtx.failed)
	}
	for (const [p, t] of mergedCtx.total) {
		const existing = ctx.total.get(p)
		if (!existing) {
			ctx.total.set(p, { ...t })
			continue
		}
		existing.totalDirs += t.totalDirs
		existing.totalFiles += t.totalFiles
		existing.totalMatchedFiles += t.totalMatchedFiles
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
	const { match, path, parentPath, tooDeep, includeParent, isDir, entry, context } = r
	const { dirs, invert } = options

	const isExcluded = isMatchExcluded(invert, match)

	if (context) {
		patchMerged(ctx, stream, context)
	}

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
		if (dir !== "." && dir !== "/") {
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
}
