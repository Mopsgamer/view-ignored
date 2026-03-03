import { dirname } from "node:path"

import type { ScanOptions } from "../types.js"
import type { MatcherContext } from "./matcherContext.js"

import { getDepth } from "../getDepth.js"
import { opendir } from "../opendir.js"
import { unixify, join } from "../unixify.js"
import { walkIncludes } from "../walk.js"
import { resolveSources } from "./resolveSources.js"

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

	const { target, fs, cwd, signal } = options

	const isDir = entry.endsWith("/")
	if (isDir) {
		// recursive parent population
		const direntPath = entry.replace(/\/$/, "")
		if (direntPath === ".") {
			return true
		}
		const parentPath = dirname(direntPath)
		await resolveSources({ ctx, cwd, dir: direntPath, fs, signal, target })
		ctx.paths.set(
			entry,
			await target.ignores({ fs, cwd, entry: direntPath, ctx, signal, target, parentPath }),
		)
		if (ctx.totalFiles >= 0) {
			ctx.totalDirs++
		}
		if (parentPath !== ".") {
			void (await matcherContextAddPath(ctx, options, parentPath + "/"))
		}
		return true
	}

	const parentPath = dirname(entry)

	const isSource = target.extractors.some((e) => e.path === entry)
	if (isSource) {
		// add pattern sources
		await matcherContextRemovePath(ctx, options, parentPath + "/")
		await rescan(ctx, { ...options, within: parentPath })
	}

	// add paths
	// 1. recursively populate parents
	await matcherContextAddPath(ctx, options, parentPath + "/")
	// 2. if ignored, remove, otherwise add
	const match = await target.ignores({ fs, cwd, entry, ctx, signal, target, parentPath })
	if (match.ignored) {
		// 2.1. remove
		await matcherContextRemovePath(ctx, options, entry)
		return false
	}
	// 2.2. add
	if (ctx.totalFiles >= 0) {
		ctx.totalFiles++
		ctx.totalMatchedFiles++
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
		const direntPath = entry.replace(/\/$/, "")
		for (const [element] of ctx.paths) {
			if (entry !== "./" && !element.startsWith(entry)) {
				continue
			}
			if (ctx.totalFiles >= 0) {
				const isDir = element.endsWith("/")
				if (isDir) {
					ctx.totalDirs--
				} else {
					ctx.totalFiles--
					ctx.totalMatchedFiles--
				}
			}
			ctx.paths.delete(element)
		}
		for (const [element] of ctx.depthPaths) {
			if (entry !== "./" && !element.startsWith(direntPath)) {
				continue
			}
			ctx.depthPaths.delete(element)
		}
		for (const [element] of ctx.external) {
			if (entry !== "./" && !element.startsWith(direntPath)) {
				continue
			}
			if (ctx.external.delete(element) && ctx.failed.length) {
				// 3.1. remove failed sources
				const failedEntryIndex = ctx.failed.findIndex((fail) => dirname(fail.path) === element)
				if (failedEntryIndex >= 0) {
					ctx.failed.splice(failedEntryIndex, 1)
				}
			}
		}
		return true
	}

	const parent = dirname(entry)

	const isSource = options.target.extractors.some((e) => e.path === entry)
	if (isSource) {
		// remove pattern sources
		// rescan directory and repopulate stats
		await matcherContextRemovePath(ctx, options, parent + "/")
		await rescan(ctx, { ...options, within: parent })
		return true
	}
	// remove path
	// 1. change stats
	{
		if (ctx.totalFiles >= 0) {
			ctx.totalFiles--
			ctx.totalMatchedFiles--
		}
		// 1.1 remove depthPaths
		const { depthSlash } = getDepth(entry, options.depth)
		if (depthSlash >= 0) {
			const dir = entry.substring(0, depthSlash)
			let num = ctx.depthPaths.get(dir)
			if (num) {
				num--
				if (num <= 0) {
					ctx.depthPaths.delete(dir)
				} else {
					ctx.depthPaths.set(dir, num)
				}
			}
		}
	}
	// 2. remove from paths
	ctx.paths.delete(entry)
	return true
}

async function rescan(ctx: MatcherContext, options: Required<ScanOptions>): Promise<void> {
	const { cwd, within, fs, signal, target } = options

	const normalCwd = unixify(cwd)
	let from = join(normalCwd, within)
	await opendir({ ctx, cwd: normalCwd, fs, signal, target }, from, (entry, parentPath, path) => {
		return walkIncludes({
			path,
			parentPath,
			entry,
			ctx,
			stream: undefined,
			scanOptions: { ...options, cwd: normalCwd },
		})
	})
	ctx.totalDirs = ctx.totalFiles = ctx.totalMatchedFiles = -1
}
