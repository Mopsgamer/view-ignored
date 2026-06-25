import type { ScanOptions } from "../types.js"
import type { MatcherContext } from "./matcherContext.js"
import type { Resource } from "./resource.js"
import type { RuleMatch } from "./rule.js"

import { scanParallel } from "../scanParallel.js"
import { dirname, unixify } from "../unixify.js"
import { walkPatchResult, walkPatchTotal, propagateTotals, type WalkResult } from "../walk.js"
import { resolveSources } from "./resolveSources.js"

function promiseCb<T>(resolve: (value: T) => void, reject: (reason?: unknown) => void) {
	return (err: Error | null, res: T) => {
		if (err) {
			reject(err)
			return
		}
		resolve(res)
	}
}

/**
 * Provides patching abilities for the given {@link MatcherContext}.
 * Directories should have the slash suffix.
 *
 * @since 0.6.0
 */
export async function matcherContextAddPath(
	ctx: MatcherContext,
	options: Required<ScanOptions>,
	entry: string,
): Promise<string[]> {
	const added: string[] = []
	if (ctx.paths.has(entry)) {
		return added
	}

	const isDir = entry.endsWith("/")
	const direntPath = isDir ? entry.slice(0, -1) : entry
	if (isDir && direntPath === ".") {
		return added
	}
	const parentPath = dirname(direntPath)

	const { target, fs, cwd, signal, depth: maxDepth } = options

	if (isDir) {
		// recursive parent population
		const {
			promise: resourcePromise,
			resolve: resResolve,
			reject: resReject,
		} = Promise.withResolvers<Resource>()
		resolveSources(
			{
				cwd,
				dir: direntPath,
				external: ctx.external,
				fs,
				signal,
				target,
			},
			promiseCb(resResolve, resReject),
		)
		const resource = await resourcePromise

		const {
			promise: matchPromise,
			resolve: matchResolve,
			reject: matchReject,
		} = Promise.withResolvers<RuleMatch>()
		target.ignores(
			{
				cwd,
				entry: direntPath,
				fs,
				parentPath,
				resource,
				signal,
				target,
			},
			promiseCb(matchResolve, matchReject),
		)
		const match = await matchPromise
		if (!match.ignored && (options.dirs || !isDir)) {
			if (!ctx.paths.has(entry)) {
				ctx.paths.set(entry, match)
				added.push(entry)
			}
		}
		updateTotals(ctx, parentPath, 0, 0, 1)
		if (parentPath !== ".") {
			added.push(...(await matcherContextAddPath(ctx, options, parentPath + "/")))
		}
		return added
	}

	const isSource = target.extractors.some((e) => e.path === entry)
	if (isSource) {
		// add pattern sources
		const { promise: resultPromise, resolve, reject } = Promise.withResolvers<WalkResult[] | null>()
		scanParallel(
			{
				external: ctx.external,
				failed: ctx.failed,
				onResult: (result) => {
					if ("dir" in result) {
						walkPatchTotal(ctx, maxDepth, result)
						return
					}
					const { path, parentPath: rParentPath, includeParent } = result
					if (!ctx.paths.has(path)) {
						added.push(path)
					}
					if (includeParent && !ctx.paths.has(rParentPath + "/")) {
						added.push(rParentPath + "/")
					}
					walkPatchResult(ctx, result, options)
				},
				scanOptions: { ...options, within: unixify(parentPath) },
				stream: undefined,
			},
			promiseCb(resolve, reject),
		)
		await matcherContextRemovePath(ctx, options, parentPath + "/")
		await resultPromise
		propagateTotals(ctx.total)
	}

	// add paths
	// 1. recursively populate parents
	added.push(...(await matcherContextAddPath(ctx, options, parentPath + "/")))
	// 2. if ignored, remove, otherwise add
	const { promise: resPromise, resolve: resRes, reject: resRej } = Promise.withResolvers<Resource>()
	resolveSources(
		{
			cwd,
			dir: parentPath,
			external: ctx.external,
			fs,
			signal,
			target,
		},
		promiseCb(resRes, resRej),
	)
	const resource = await resPromise

	const { promise: mPromise, resolve: mRes, reject: mRej } = Promise.withResolvers<RuleMatch>()
	target.ignores(
		{
			cwd,
			entry,
			fs,
			parentPath,
			resource,
			signal,
			target,
		},
		promiseCb(mRes, mRej),
	)
	const match = await mPromise

	updateTotals(ctx, parentPath, 1, match.ignored ? 0 : 1, 0)

	if (match.ignored) {
		return added
	}

	if (options.dirs || !isDir) {
		if (!ctx.paths.has(entry)) {
			ctx.paths.set(entry, match)
			added.push(entry)
		}
	}
	return added
}

/**
 * Provides patching abilities for the given {@link MatcherContext}.
 * Directories should have the slash suffix.
 *
 * @since 0.6.0
 */
export async function matcherContextRemovePath(
	ctx: MatcherContext,
	options: Required<ScanOptions>,
	entry: string,
): Promise<string[]> {
	const removed: string[] = []
	const isDir = entry.endsWith("/")
	const direntPath = isDir ? entry.slice(0, -1) : entry
	if (isDir && direntPath === ".") {
		for (const [path] of ctx.paths) {
			removed.push(path)
		}
		ctx.paths.clear()
		ctx.external.clear()
		ctx.failed.length = 0
		ctx.total.set(direntPath, { totalDirs: 0, totalFiles: 0, totalMatchedFiles: 0 })
		return removed
	}
	const parentPath = dirname(direntPath)
	const parentPathDir = parentPath + "/"

	if (isDir) {
		// remove directories
		let deletedDirs = 0,
			deletedFiles = 0,
			deletedMatchedFiles = 0
		const total = ctx.total.get(direntPath)
		if (total) {
			deletedDirs = total.totalDirs + 1
			deletedFiles = total.totalFiles
			deletedMatchedFiles = total.totalMatchedFiles
			ctx.total.delete(direntPath)
		} else {
			deletedDirs = 1
		}

		updateTotals(ctx, parentPath, -deletedFiles, -deletedMatchedFiles, -deletedDirs)

		for (const [element] of ctx.paths) {
			if (element.startsWith(entry)) {
				ctx.paths.delete(element)
				removed.push(element)
			}
		}

		for (const [element] of ctx.external) {
			if (!element.startsWith(direntPath)) {
				continue
			}
			if (!ctx.external.delete(element) || !ctx.failed.length) {
				continue
			}
			// 3.1. remove failed sources
			const failedEntryIndex = ctx.failed.findIndex((fail) => dirname(fail.source.path) === element)
			if (failedEntryIndex >= 0) {
				ctx.failed.splice(failedEntryIndex, 1)
			}
		}
		return removed
	}

	const isSource = options.target.extractors.some((e) => e.path === entry)
	if (isSource) {
		const maxDepth = options.depth
		// remove pattern sources
		// rescan directory and repopulate stats
		const { promise: resultPromise, resolve, reject } = Promise.withResolvers<WalkResult[] | null>()
		scanParallel(
			{
				external: ctx.external,
				failed: ctx.failed,
				onResult: (result) => {
					if ("dir" in result) {
						walkPatchTotal(ctx, maxDepth, result)
						return
					}
					walkPatchResult(ctx, result, options)
				},
				scanOptions: { ...options, within: unixify(parentPath) },
				stream: undefined,
			},
			promiseCb(resolve, reject),
		)
		removed.push(...(await matcherContextRemovePath(ctx, options, parentPathDir)))
		await resultPromise
		propagateTotals(ctx.total)
		return removed
	}
	// remove path
	// 1. change stats
	updateTotals(ctx, parentPath, -1, ctx.paths.has(entry) ? -1 : 0, 0)

	// 2. remove from paths
	if (ctx.paths.has(entry)) {
		ctx.paths.delete(entry)
		removed.push(entry)
	}
	return removed
}

function updateTotals(
	ctx: MatcherContext,
	path: string,
	deltaFiles: number,
	deltaMatchedFiles: number,
	deltaDirs: number,
) {
	for (let parent = path; ; ) {
		const total = ctx.total.get(parent)
		if (total) {
			total.totalDirs += deltaDirs
			total.totalFiles += deltaFiles
			total.totalMatchedFiles += deltaMatchedFiles
		} else {
			ctx.total.set(parent, {
				totalDirs: deltaDirs,
				totalFiles: deltaFiles,
				totalMatchedFiles: deltaMatchedFiles,
			})
		}
		if (parent === "." || parent === "/") break
		parent = dirname(parent)
	}
}
