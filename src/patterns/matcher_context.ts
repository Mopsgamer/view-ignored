import { dirname } from "node:path"
import { scan, type ScanOptions } from "../scan.js"
import { getDepth } from "../getdepth.js"
import type { FsAdapter } from "../fs_adapter.js"
import type { Source } from "./matcher.js"

/**
 * The results and statistics of a scanning operation.
 */
export interface MatcherContext {
	/**
	 * `Set` can be sorted, but `view-ignored`
	 * does not sort paths.
	 * @example
	 * new Set(sort(new Set(['a/b', 'a/a'])))
	 */
	paths: Set<string>
	/**
	 * Maps directory paths to their corresponding sources.
	 * @example
	 * "src" => Source
	 */
	external: Map<string, Source>
	/**
	 * If any fatal errors were encountered during source extraction.
	 */
	failed: boolean
	/**
	 * Maps directory paths to the quantity of files they contain.
	 * @example
	 * // for
	 * "src/"
	 * "src/components/"
	 * "src/views/"
	 * "src/views/index.html"
	 *
	 * // depth: 0
	 * "src/" => 1
	 *
	 * // depth: 1
	 * "src/components/" => 0
	 * "src/views/" => 1
	 */
	depthPaths: Map<string, number>
	/**
	 * Total number of files scanned.
	 */
	totalFiles: number
	/**
	 * Total number of files matched by the target.
	 */
	totalMatchedFiles: number
	/**
	 * Total number of directories scanned.
	 */
	totalDirs: number
	/**
	 * File system promises interface.
	 */
	fsp: FsAdapter
}

/**
 * Returns `true` if the path is included.
 * If it is not ignored by the target,
 * adds it to the {@link MatcherContext.paths}
 * and updates statistics.
 */
export async function matcherContextAddPath(
	ctx: MatcherContext,
	entry: string,
	options: Pick<ScanOptions, "target" | "cwd">,
): Promise<boolean> {
	if (ctx.paths.has(entry)) {
		return true
	}

	const { target, cwd = (await import("node:process")).cwd().replaceAll("\\", "/") } = options

	{
		const parent = dirname(entry)
		if (!(parent === "." || ctx.paths.has(parent))) {
			await matcherContextAddPath(ctx, parent + "/", options)
		}
	}

	const isDir = entry.endsWith("/")
	if (isDir) {
		const ignored = await target.ignores(cwd, entry.substring(0, entry.length - 1), ctx)
		return !ignored
	}
	const ignored = await target.ignores(cwd, entry, ctx)
	if (ignored) {
		return false
	}
	ctx.paths.add(entry)
	ctx.totalFiles++
	ctx.totalMatchedFiles++
	return true
}

/**
 * Removes a path from the {@link MatcherContext.paths} and updates statistics.
 * If you want to remove a source, use {@link matcherContextRefreshDir} instead.
 */
export async function matcherContextRemovePath(
	ctx: MatcherContext,
	entry: string,
	options: Pick<ScanOptions, "depth">,
): Promise<void> {
	if (entry === ".") {
		entry = "./"
	}
	const isDir = entry.endsWith("/")

	if (!isDir) {
		if (ctx.paths.delete(entry)) {
			const parent = dirname(entry)
			if (ctx.external.get(parent)?.path === entry) {
				ctx.external.delete(dirname(entry))
			}
			ctx.totalFiles--
			ctx.totalMatchedFiles--
		}
		return
	}

	entry = entry.substring(0, entry.length - 1)

	// if directory
	ctx.external.delete(entry + "/")
	if (ctx.paths.delete(entry + "/")) {
		ctx.totalDirs--
	}

	const { depth: maxDepth = Infinity } = options
	const { depthSlash, depth } = getDepth(entry, maxDepth)
	if (depth > 0) {
		const parent = entry.substring(0, depthSlash)
		const count = (ctx.depthPaths.get(parent) ?? 1) - 1
		if (count > 0) {
			ctx.depthPaths.set(parent, count)
		}
		ctx.depthPaths.delete(entry)
	}

	const a = [...ctx.paths]
	for (const path of a) {
		if (depth > 0 && !path.startsWith(entry)) {
			continue
		}

		const isDir = path.endsWith("/")
		if (!isDir) {
			let subpath = path
			if (depth > 0) {
				subpath = path.substring(entry.length)
			}
			if (!subpath.includes("/")) {
				await matcherContextRemovePath(ctx, path, options)
			}
			continue
		}

		await matcherContextRemovePath(ctx, path, options)
	}
}

/**
 * Refreshes a directory path in the {@link MatcherContext.paths}.
 * Updates paths and statistics.
 */
export async function matcherContextRefreshDir(
	ctx: MatcherContext,
	dir: string,
	options: ScanOptions,
): Promise<void> {
	if (dir.endsWith("/")) {
		dir = dir.substring(0, dir.length - 1)
	}

	await matcherContextRemovePath(ctx, dir + "/", options)

	const { cwd: cwdo = (await import("node:process")).cwd().replaceAll("\\", "/") } = options
	let cwd = cwdo + "/" + dir
	if (dir === ".") {
		cwd = cwdo
	}
	const subctx = await scan({ ...options, cwd })

	for (const path of subctx.paths) {
		let fullPath = dir + "/" + path
		if (dir === ".") {
			fullPath = path
		}
		ctx.paths.add(fullPath)
	}
	for (const [path, count] of subctx.depthPaths) {
		let fullPath = dir + "/" + path
		if (dir === ".") {
			fullPath = path
		}
		ctx.depthPaths.set(fullPath, count)
	}
	for (const [path, source] of subctx.external) {
		let fullPath = dir + "/" + path
		if (dir === ".") {
			fullPath = path
		}
		ctx.external.set(fullPath, source)
	}
	ctx.totalFiles += subctx.totalFiles
	ctx.totalDirs += subctx.totalDirs
	ctx.totalMatchedFiles += subctx.totalMatchedFiles
	ctx.failed ||= subctx.failed
}
