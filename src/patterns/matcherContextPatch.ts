import type { ScanOptions } from "../types.js"
import type { WalkResult } from "../walk.js"
import type { MatcherContext } from "./matcherContext.js"
import type { Resource } from "./resource.js"
import type { RuleMatch } from "./rule.js"

import { scanParallel } from "../scanParallel.js"
import { ScanFlags } from "../types.js"
import { dirname } from "../unixify.js"
import { propagateTotals, walkPatchResult, walkPatchTotal } from "../walk.js"
import { resolveSources } from "./resolveSources.js"

function promiseCb(resolve: (value: any) => void, reject: (reason?: any) => void) {
	return (err: Error | null, res: any) => {
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
): Promise<boolean> {
	if (ctx.paths.has(entry)) {
		return false
	}

	const isDir = entry.endsWith("/")
	const direntPath = isDir ? entry.slice(0, -1) : entry
	if (isDir && (direntPath === "." || ctx.paths.has(entry))) {
		return isDir && direntPath === "."
	}
	const parentPath = dirname(direntPath)

	const { target, fs, cwd, signal, depth: maxDepth, flags } = options

	if (isDir) {
		// recursive parent population
		const resource = await new Promise<Resource>((resolve, reject) => {
			resolveSources(
				{
					cwd,
					dir: direntPath,
					external: ctx.external,
					fs,
					signal,
					target,
				},
				promiseCb(resolve, reject),
			)
		})
		const match = await new Promise<RuleMatch>((resolve, reject) => {
			target.ignores(
				{
					cwd,
					entry: direntPath,
					fs,
					lowerEntry: direntPath.toLowerCase(),
					parentPath,
					resource,
					signal,
					target,
				},
				promiseCb(resolve, reject),
			)
		})
		let m = match
		if (flags & ScanFlags.invert) m = { ...m, ignored: !m.ignored }
		if (!m.ignored && flags & ScanFlags.dirs) {
			ctx.paths.set(entry, m)
		}
		updateTotals(ctx, parentPath, 0, 0, 1)
		if (parentPath !== ".") {
			void (await matcherContextAddPath(ctx, options, parentPath + "/"))
		}
		return true
	}

	const isSource = target.extractors.some((e) => e.path === entry)
	if (isSource) {
		// add pattern sources
		const resultPromise = new Promise<WalkResult[] | null>((resolve, reject) => {
			scanParallel(
				{
					external: ctx.external,
					failed: ctx.failed,
					onResult: (result) => {
						if ("dir" in result) {
							walkPatchTotal(ctx, maxDepth, result)
						} else {
							walkPatchResult(ctx, result, flags)
						}
					},
					scanOptions: options,
					stream: undefined,
					within: parentPath,
				},
				promiseCb(resolve, reject),
			)
		})
		await matcherContextRemovePath(ctx, options, parentPath + "/")
		await resultPromise
		propagateTotals(ctx.total)
	}

	// add paths
	// 1. recursively populate parents
	await matcherContextAddPath(ctx, options, parentPath + "/")
	// 2. if ignored, remove, otherwise add
	const resource = await new Promise<Resource>((resolve, reject) => {
		resolveSources(
			{
				cwd,
				dir: parentPath,
				external: ctx.external,
				fs,
				signal,
				target,
			},
			promiseCb(resolve, reject),
		)
	})

	const match = await new Promise<RuleMatch>((resolve, reject) => {
		target.ignores(
			{
				cwd,
				entry,
				fs,
				lowerEntry: entry.toLowerCase(),
				parentPath,
				resource,
				signal,
				target,
			},
			promiseCb(resolve, reject),
		)
	})

	let m = match
	if (flags & ScanFlags.invert) m = { ...m, ignored: !m.ignored }

	updateTotals(ctx, parentPath, 1, m.ignored ? 0 : 1, 0)

	if (m.ignored) {
		return false
	}

	ctx.paths.set(entry, m)
	return true
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
): Promise<boolean> {
	const isDir = entry.endsWith("/")
	const direntPath = isDir ? entry.slice(0, -1) : entry

	const { target, depth: maxDepth, flags } = options

	if (isDir && direntPath === ".") {
		ctx.paths.clear()
		ctx.external.clear()
		ctx.failed.length = 0
		ctx.total.set(direntPath, { totalDirs: 0, totalFiles: 0, totalMatchedFiles: 0 })
		return true
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
		return true
	}

	const isSource = target.extractors.some((e) => e.path === entry)
	if (isSource) {
		// remove pattern sources
		// rescan directory and repopulate stats
		const resultPromise = new Promise<WalkResult[] | null>((resolve, reject) => {
			scanParallel(
				{
					external: ctx.external,
					failed: ctx.failed,
					onResult: (result) => {
						if ("dir" in result) {
							walkPatchTotal(ctx, maxDepth, result)
						} else {
							walkPatchResult(ctx, result, flags)
						}
					},
					scanOptions: options,
					stream: undefined,
					within: parentPath,
				},
				promiseCb(resolve, reject),
			)
		})
		await matcherContextRemovePath(ctx, options, parentPathDir)
		await resultPromise
		propagateTotals(ctx.total)
		return true
	}
	// remove path
	// 1. change stats
	updateTotals(ctx, parentPath, -1, ctx.paths.has(entry) ? -1 : 0, 0)

	// 2. remove from paths
	ctx.paths.delete(entry)
	return true
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
