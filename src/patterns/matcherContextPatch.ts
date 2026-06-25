import type { ScanOptions } from "../types.js"
import type { MatcherContext } from "./matcherContext.js"
import type { Resource } from "./resource.js"
import type { RuleMatch } from "./rule.js"

import { getOrInsertComputed } from "../mapUtils.js"
import { scanParallel } from "../scanParallel.js"
import { dirname, unixify } from "../unixify.js"
import { walkPatchResult, walkPatchTotal, propagateTotals, type WalkResult } from "../walk.js"
import { resolveSources } from "./resolveSources.js"

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
	if (isDir && entry === "./") {
		return added
	}
	const direntPath = isDir ? entry.slice(0, -1) : entry
	const parentPath = dirname(direntPath)

	const { target, fs, cwd, signal, depth: maxDepth } = options

	if (isDir) {
		const resource = await new Promise<Resource>((resolve, reject) =>
			resolveSources(
				{
					cwd,
					dir: direntPath,
					external: ctx.external,
					fs,
					signal,
					target,
				},
				(err, res) => (err ? reject(err) : resolve(res)),
			),
		)

		const match = await new Promise<RuleMatch>((resolve, reject) =>
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
				(err, res) => (err ? reject(err) : resolve(res)),
			),
		)

		if (!match.ignored && options.dirs) {
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
		const resultPromise = new Promise<WalkResult[] | null>((resolve, reject) =>
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
				(err, res) => (err ? reject(err) : resolve(res)),
			),
		)
		await matcherContextRemovePath(ctx, options, parentPath + "/")
		await resultPromise
		propagateTotals(ctx.total)
	}

	if (parentPath !== ".") {
		added.push(...(await matcherContextAddPath(ctx, options, parentPath + "/")))
	}

	const resource = await new Promise<Resource>((resolve, reject) =>
		resolveSources(
			{
				cwd,
				dir: parentPath,
				external: ctx.external,
				fs,
				signal,
				target,
			},
			(err, res) => (err ? reject(err) : resolve(res)),
		),
	)

	const match = await new Promise<RuleMatch>((resolve, reject) =>
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
			(err, res) => (err ? reject(err) : resolve(res)),
		),
	)

	updateTotals(ctx, parentPath, 1, match.ignored ? 0 : 1, 0)
	if (!match.ignored) {
		if (!ctx.paths.has(entry)) {
			ctx.paths.set(entry, match)
			added.push(entry)
		}
	}

	return added
}

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

		const entryLen = entry.length
		for (const [element] of ctx.paths) {
			if (element.length >= entryLen && element.startsWith(entry)) {
				ctx.paths.delete(element)
				removed.push(element)
			}
		}

		const direntPathLen = direntPath.length
		for (const [element] of ctx.external) {
			if (element.length >= direntPathLen && (element === direntPath || element.startsWith(direntPath + "/"))) {
				if (ctx.external.delete(element) && ctx.failed.length) {
					const failedEntryIndex = ctx.failed.findIndex((fail) => dirname(fail.source.path) === element)
					if (failedEntryIndex >= 0) {
						ctx.failed.splice(failedEntryIndex, 1)
					}
				}
			}
		}
		return removed
	}

	const isSource = options.target.extractors.some((e) => e.path === entry)
	if (isSource) {
		const maxDepth = options.depth
		const resultPromise = new Promise<WalkResult[] | null>((resolve, reject) =>
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
				(err, res) => (err ? reject(err) : resolve(res)),
			),
		)
		removed.push(...(await matcherContextRemovePath(ctx, options, parentPathDir)))
		await resultPromise
		propagateTotals(ctx.total)
		return removed
	}

	const deleted = ctx.paths.delete(entry)
	if (deleted) {
		removed.push(entry)
	}

	updateTotals(ctx, parentPath, -1, deleted ? -1 : 0, 0)

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
		const total = getOrInsertComputed(ctx.total, parent, () => ({
			totalDirs: 0,
			totalFiles: 0,
			totalMatchedFiles: 0,
		}))
		total.totalDirs += deltaDirs
		total.totalFiles += deltaFiles
		total.totalMatchedFiles += deltaMatchedFiles

		if (parent === "." || parent === "/") break
		parent = dirname(parent)
	}
}
