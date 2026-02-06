import type { MatcherContext } from "./matcherContext.js"
import type { ScanOptions } from "../types.js"
import * as nodepath from "node:path"
import { getDepth } from "../getDepth.js"
import { opendir } from "../opendir.js"
import { walkIncludes } from "../walk.js"

/**
 */
export async function matcherContextAddPath(
	ctx: MatcherContext,
	options: Required<ScanOptions>,
	entry: string,
): Promise<boolean> {
	if (ctx.paths.has(entry)) {
		return false
	}

	const { target, fs, cwd } = options

	const isDir = entry.endsWith("/")
	if (isDir) {
		// recursive parent population
		const direntPath = entry.replace(/\/$/, "")
		if (direntPath === ".") {
			return true
		}
		ctx.paths.set(entry, await target.ignores(fs, cwd, direntPath, ctx))
		ctx.totalDirs++
		const parent = nodepath.dirname(direntPath)
		if (parent !== ".") {
			void (await matcherContextAddPath(ctx, options, parent + "/"))
		}
		return true
	}

	const parent = nodepath.dirname(entry)

	// add paths
	// 1. recursively populate parents
	await matcherContextAddPath(ctx, options, parent + "/")
	// 2. if ignored, remove, otherwise add
	const match = await target.ignores(fs, cwd, entry, ctx)
	if (match.ignored) {
		// 2.1. remove
		await matcherContextRemovePath(ctx, options, entry)
		return false
	}
	// 2.2. add
	ctx.totalFiles++
	ctx.totalMatchedFiles++
	ctx.paths.set(entry, match)

	const isSource = target.extractors.some((e) => e.path === entry)
	if (isSource) {
		// add pattern sources
		await matcherContextRemovePath(ctx, options, parent + "/")
		await rescan(ctx, options, entry)
	}
	return true
}

/**
 */
export async function matcherContextRemovePath(
	ctx: MatcherContext,
	options: Required<ScanOptions>,
	entry: string,
): Promise<boolean> {
	const isDir = entry.endsWith("/")
	if (isDir) {
		// remove directories
		for (const [element] of ctx.paths) {
			if (entry !== "./" && !element.startsWith(entry)) {
				continue
			}
			const isDir = element.endsWith("/")
			// 1. remove stats
			if (isDir) {
				ctx.totalDirs--
			} else {
				ctx.totalFiles--
				ctx.totalMatchedFiles--
			}
			// 2. remove depthPaths
			const { depthSlash } = getDepth(entry, options.depth)
			if (depthSlash >= 0) {
				const dir = entry.substring(0, depthSlash)
				if (ctx.depthPaths.get(dir)) {
					ctx.depthPaths.delete(dir)
				}
			}
			// 3. remove sources
			const direntPath = element.replace(/\/$/, "")
			if (ctx.external.delete(direntPath)) {
				// 3.1. remove failed sources
				const failedEntryIndex = ctx.failed.findIndex(
					(fail) => nodepath.dirname(fail.path) === direntPath,
				)
				if (failedEntryIndex >= 0) {
					ctx.failed.splice(failedEntryIndex, 1)
				}
			}
			// 4. remove paths
			ctx.paths.delete(element)
		}
		return true
	}

	const parent = nodepath.dirname(entry)

	const isSource = options.target.extractors.some((e) => e.path === entry)
	if (isSource) {
		// remove pattern sources
		// rescan directory and repopulate stats
		await matcherContextRemovePath(ctx, options, parent + "/")
		await rescan(ctx, options, parent)
		return true
	}
	// remove path
	// 1. change stats
	{
		ctx.totalFiles--
		ctx.totalMatchedFiles--
		// 1.1 remove depthPaths
		const { depthSlash } = getDepth(entry, options.depth)
		if (depthSlash >= 0) {
			const dir = entry.substring(0, depthSlash)
			let num = ctx.depthPaths.get(dir) || 1
			num--
			if (num === 0) {
				ctx.depthPaths.delete(dir)
			} else {
				ctx.depthPaths.set(dir, num)
			}
		}
	}
	// 2. remove from paths
	ctx.paths.delete(entry)
	return true
}

async function rescan(
	ctx: MatcherContext,
	options: Required<ScanOptions>,
	entry: string,
) {
	if (entry !== '.') options.cwd += "/" + entry
	const normalCwd = options.cwd.replaceAll("\\", "/").replace(/\w:/, "")
	await opendir(options.fs, options.cwd, (entry) =>
		walkIncludes({
			entry,
			ctx,
			stream: undefined,
			scanOptions: { ...options, cwd: normalCwd },
		}),
	)
}
