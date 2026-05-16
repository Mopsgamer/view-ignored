import type { ScanOptions } from "../types.js"
import type { MatcherContext } from "./matcherContext.js"
import type { Resource } from "./resource.js"
import type { RuleMatch } from "./rule.js"

import { scanParallel } from "../scanParallel.js"
import { dirname } from "../unixify.js"
import {
	walkPatchResult,
	walkPatchTotal,
	propagateTotals,
	type WalkResult,
	type WalkTotal,
} from "../walk.js"
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

	const { target, fs, cwd, signal, depth: maxDepth } = options

	const isDir = entry.endsWith("/")
	if (isDir) {
		// recursive parent population
		const direntPath = entry.replace(/\/$/, "")
		if (direntPath === ".") {
			return true
		}
		const parentPath = dirname(direntPath)
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
		ctx.paths.set(
			entry,
			await new Promise<RuleMatch>((resolve, reject) => {
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
					promiseCb(resolve, reject),
				)
			}),
		)
		const total = ctx.total.get(parentPath)
		if (!total) {
			ctx.total.set(parentPath, { totalDirs: 1, totalFiles: 0, totalMatchedFiles: 0 })
		} else if (total.totalFiles >= 0) {
			total.totalDirs++
		}
		if (parentPath !== ".") {
			void (await matcherContextAddPath(ctx, options, parentPath + "/"))
		}
		return true
	}

	const parentPath = dirname(entry)

	const isSource = target.isIgnoreFile(entry)
	if (isSource) {
		// add pattern sources
		const resultPromise = new Promise<WalkResult[] | null>((resolve, reject) => {
			scanParallel(
				{
					external: ctx.external,
					failed: ctx.failed,
					onResult: (result) => {
						if ("dir" in result) {
							walkPatchTotal(ctx, maxDepth, result as WalkTotal)
						} else {
							walkPatchResult(ctx, result as WalkResult)
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
	const resource = (await new Promise<Resource>((resolve, reject) => {
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
	})) as Resource

	const match = await new Promise<RuleMatch>((resolve, reject) => {
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
			promiseCb(resolve, reject),
		)
	})

	if (match.ignored) {
		// 2.1. remove
		await matcherContextRemovePath(ctx, options, entry)
		return false
	}
	// 2.2. add
	const total = ctx.total.get(parentPath)
	if (!total) {
		ctx.total.set(parentPath, { totalDirs: 0, totalFiles: 1, totalMatchedFiles: 1 })
	} else {
		total.totalFiles++
		total.totalMatchedFiles++
	}
	ctx.paths.set(entry, match)
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
	if (isDir) {
		// remove directories
		const direntPath = entry.slice(0, -1)
		if (direntPath === ".") {
			ctx.paths.clear()
			ctx.external.clear()
			ctx.failed.length = 0
			ctx.total.set(direntPath, { totalDirs: 0, totalFiles: 0, totalMatchedFiles: 0 })
			return true
		}

		let deletedDirs = 0,
			deletedFiles = 0
		const total = ctx.total.get(direntPath)!
		for (const [element] of ctx.paths) {
			if (!element.startsWith(entry)) {
				continue
			}
			if (total && total.totalFiles >= 0) {
				const isDir = element.endsWith("/")
				if (isDir) {
					deletedDirs++
				} else {
					deletedFiles++
				}
			}
			ctx.paths.delete(element)
		}

		deleteTotals(ctx, entry, deletedDirs, deletedFiles)

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

	const parentPath = dirname(entry)
	const parentPathDir = parentPath + "/"

	const isSource = options.target.isIgnoreFile(entry)
	if (isSource) {
		const maxDepth = options.depth
		// remove pattern sources
		// rescan directory and repopulate stats
		const resultPromise = new Promise<WalkResult[] | null>((resolve, reject) => {
			scanParallel(
				{
					external: ctx.external,
					failed: ctx.failed,
					onResult: (result) => {
						if ("dir" in result) {
							walkPatchTotal(ctx, maxDepth, result as WalkTotal)
						} else {
							walkPatchResult(ctx, result as WalkResult)
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
	{
		const total = ctx.total.get(parentPath)
		if (!total) {
			ctx.total.set(parentPath, { totalDirs: 0, totalFiles: 0, totalMatchedFiles: 0 })
		} else if (total.totalFiles >= 0) {
			total.totalFiles--
			total.totalMatchedFiles--
		}
	}
	// 2. remove from paths
	ctx.paths.delete(entry)
	return true
}

function deleteTotals(ctx: MatcherContext, entry: string, deletedDirs = 0, deletedFiles = 0) {
	if (entry.endsWith("/")) ctx.total.delete(entry)
	for (let parent = dirname(entry); parent !== "./"; parent = dirname(parent) + "/") {
		const total = ctx.total.get(parent)
		if (!total) continue
		total.totalDirs -= deletedDirs
		total.totalFiles -= deletedFiles
		total.totalMatchedFiles -= deletedFiles
	}
}
