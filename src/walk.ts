import type { Dirent } from "node:fs"

import type { MatcherContext } from "./patterns/matcherContext.js"
import type { MatcherStream } from "./patterns/matcherStream.js"
import type { Resource } from "./patterns/resource.js"
import type { ScanOptions } from "./types.js"

import { getDepth } from "./getDepth.js"
import { isRuleMatchInvalid, type RuleMatch } from "./patterns/rule.js"

export type WalkOptions = {
	relPath: string
	parentPath: string
	entry: Dirent
	external: Map<string, Resource>
	stream: MatcherStream | undefined
	scanOptions: Required<ScanOptions>
}

export type WalkResult = {
	addToPaths: [string, RuleMatch] | undefined
	incrementTotalDirs: boolean
	incrementTotalFiles: boolean
	incrementTotalMatchedFiles: boolean
	addDepthPathDir: string | undefined
	addParentToPaths: [string, RuleMatch] | undefined
	next: 0 | 1
}

export async function walkIncludes(options: WalkOptions): Promise<WalkResult> {
	const { entry, stream, scanOptions, relPath: path, parentPath, external } = options

	const { fs, target, cwd, depth: maxDepth, invert, signal, fastDepth, fastInternal } = scanOptions

	const result: WalkResult = {
		addDepthPathDir: undefined,
		addParentToPaths: undefined,
		addToPaths: undefined,
		incrementTotalDirs: false,
		incrementTotalFiles: false,
		incrementTotalMatchedFiles: false,
		next: 0,
	}

	signal?.throwIfAborted()

	const isDir = entry.isDirectory()
	let direntPath: string
	if (isDir) {
		direntPath = path + "/"
		result.incrementTotalDirs = true
	} else {
		direntPath = path
		result.incrementTotalFiles = true
	}

	if (fastDepth) {
		const { depth, depthSlash } = getDepth(path, maxDepth)
		if (depth > maxDepth) {
			let match = await target.ignores({
				cwd,
				entry: path,
				external,
				fs,
				parentPath,
				signal,
				target,
			})
			if (invert) {
				match.ignored = !match.ignored
			}

			if (isRuleMatchInvalid(match)) {
				if (stream) {
					stream.emit("dirent", { dirent: entry, match, path: direntPath })
				}
				throw match.error
			}

			if (match.ignored) {
				if (isDir && fastInternal && match.kind === "internal") {
					result.next = 1
					return result
				}
				result.next = 0
				return result
			}

			if (isDir) {
				// ctx.totalMatchedDirs++;
				// ctx.depthPaths.set(path, (ctx.depthPaths.get(path) ?? 0) + 1);
				result.next = 0
				return result
			}

			result.incrementTotalMatchedFiles = true
			const dir = path.substring(0, depthSlash)
			result.addDepthPathDir = dir
			result.next = 1
			return result
		}
	}

	let match = await target.ignores({
		cwd,
		entry: path,
		external,
		fs,
		parentPath: parentPath,
		signal,
		target,
	})
	if (invert) {
		match.ignored = !match.ignored
	}

	if (isRuleMatchInvalid(match)) {
		if (stream) {
			stream.emit("dirent", { dirent: entry, match, path: direntPath })
		}
		throw match.error
	}

	if (match.ignored) {
		if (stream) {
			stream.emit("dirent", { dirent: entry, match, path: direntPath })
		}
		if (isDir && fastInternal && match.kind === "internal") {
			result.next = 1
			return result
		}
		result.next = 0
		return result
	}

	if (isDir) {
		// ctx.totalMatchedDirs++;
		// ctx.depthPaths.set(path, (ctx.depthPaths.get(path) ?? 0) + 1);
		const { depth } = getDepth(path, maxDepth)
		if (depth <= maxDepth) {
			result.addToPaths = [direntPath, match]
			if (stream) {
				stream.emit("dirent", { dirent: entry, match, path: direntPath })
			}
		}
		result.next = 0
		return result
	}

	result.incrementTotalMatchedFiles = true
	const { depth, depthSlash } = getDepth(path, maxDepth)
	if (depth > maxDepth) {
		const dir = path.substring(0, depthSlash)
		result.addDepthPathDir = dir
		result.next = 0
		return result
	}

	if (depth <= maxDepth) {
		const lastSlash = path.lastIndexOf("/")
		if (lastSlash >= 0) {
			const dir = path.substring(0, lastSlash) + "/"
			result.addParentToPaths = [dir, match]
			if (stream) {
				stream.emit("dirent", { dirent: entry, match, path: dir })
			}
		}
		result.addToPaths = [direntPath, match]
		if (stream) {
			stream.emit("dirent", { dirent: entry, match, path: direntPath })
		}
	}

	result.next = 0
	return result
}

/**
 * Patches the {@link MatcherContext} with the given results.
 *
 * @since 0.11.0
 */
export function walkPatch(ctx: MatcherContext, results: WalkResult[]): void {
	for (const r of results) {
		if (r.addParentToPaths) ctx.paths.set(r.addParentToPaths[0], r.addParentToPaths[1])
		if (r.addToPaths) ctx.paths.set(r.addToPaths[0], r.addToPaths[1])
		if (r.incrementTotalFiles) ctx.totalFiles++
		if (r.incrementTotalDirs) ctx.totalDirs++
		if (r.incrementTotalMatchedFiles) ctx.totalMatchedFiles++
		if (r.addDepthPathDir)
			ctx.depthPaths.set(r.addDepthPathDir, (ctx.depthPaths.get(r.addDepthPathDir) ?? 0) + 1)
	}
}
