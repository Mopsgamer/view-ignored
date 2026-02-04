import type { MatcherContext } from "./matcherContext.js"
import type { ScanOptions } from "../types.js"
import * as nodepath from "node:path"

/**
 */
export async function matcherContextAddPath(
	ctx: MatcherContext,
	options: Required<ScanOptions>,
	entry: string,
	content?: string,
): Promise<boolean> {
	if (ctx.paths.has(entry)) {
		return true
	}

	const { target, fs, cwd } = options

	const isDir = entry.endsWith("/")
	if (isDir) {
		// never add directories
		// but internally we need recursive parent population
		if (ctx.paths.has(entry)) {
			return false
		}
		ctx.paths.set(entry, await target.ignores(fs, cwd, entry, ctx))
		const parent = nodepath.dirname(entry)
		if (parent !== "." && parent !== "/") {
			void (await matcherContextAddPath(ctx, options, parent + "/"))
		}
		return true
	}

	const isSource = target.extractors.some((e) => e.path === entry)
	if (isSource) {
		// add pattern sources
		// 1. parse and extract patterns
		// 2. rescan paths, change caching
	}
	// add paths
	// 1. recursively populate parents
	{
		const parent = nodepath.dirname(entry)
		await matcherContextAddPath(ctx, options, parent + "/")
	}
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
	return true
}

/**
 */
export async function matcherContextRemovePath(
	ctx: MatcherContext,
	options: Required<ScanOptions>,
	entry: string,
): Promise<boolean> {
	if (!ctx.paths.has(entry)) {
		// never remove existing
		// no internal behaviors
		return false
	}

	const isDir = entry.endsWith("/")
	if (isDir) {
		// remove directories
		for (const [element] of ctx.paths) {
			if (!element.startsWith(entry)) {
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
			const direntPath = element.replace(/\/$/, "")
			// 2. remove depthPaths
			
			// 3. remove sources
			if (ctx.external.delete(direntPath)) {
				// 3.1. remove
				const failedEntryIndex = ctx.failed.findIndex(
					(s) => s.path.substring(0, s.path.lastIndexOf("/")) === direntPath,
				)
				if (failedEntryIndex >= 0) {
					// 3.1.1. remove failed sources
					ctx.failed.splice(failedEntryIndex, 1)
				}
			}
			// 4. remove paths
			ctx.paths.delete(element)
		}
		return true
	}

	const isSource = options.target.extractors.some((e) => e.path === entry)
	if (isSource) {
		// remove pattern sources
		// 1. rescan directory
		// 2. change stats
	}
	// remove path
	// 1. change stats
	// 2. remove self
	return false
}
