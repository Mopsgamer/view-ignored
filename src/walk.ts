import type { Dirent } from "node:fs"
import type { MatcherContext } from "./patterns/matcherContext.js"
import type { MatcherStream } from "./patterns/matcherStream.js"
import type { ScanOptions } from "./types.js"
import { posix } from "node:path"
import { getDepth } from "./getDepth.js"

export type WalkOptions = {
	entry: Dirent
	ctx: MatcherContext
	stream: MatcherStream | undefined
	scanOptions: Required<ScanOptions>
}

export async function walkIncludes(options: WalkOptions): Promise<0 | 1 | 2> {
	const { entry, ctx, stream, scanOptions } = options

	const { fs, target, cwd, depth: maxDepth, invert, signal, fastDepth, fastInternal } = scanOptions

	signal?.throwIfAborted()

	const path = posix.relative(
		cwd,
		entry.parentPath.replaceAll("\\", "/").replace(/\w:/, "") + "/" + entry.name,
	)

	const isDir = entry.isDirectory()
	let direntPath: string
	if (isDir) {
		direntPath = path + "/"
		ctx.totalDirs++
	} else {
		direntPath = path
		ctx.totalFiles++
	}

	if (fastDepth) {
		const { depth, depthSlash } = getDepth(path, maxDepth)
		if (depth > maxDepth) {
			const failedPrev = ctx.failed.length
			let match = await target.ignores(fs, cwd, path, ctx)
			if (invert) {
				match.ignored = !match.ignored
			}

			if (failedPrev < ctx.failed.length) {
				if (stream) {
					stream.emit("dirent", { dirent: entry, match, path: direntPath, ctx })
				}
				return 2
			}

			if (match.ignored) {
				if (isDir && fastInternal && match.kind === "internal") {
					return 1
				}
				return 0
			}

			if (isDir) {
				// ctx.totalMatchedDirs++;
				// ctx.depthPaths.set(path, (ctx.depthPaths.get(path) ?? 0) + 1);
				return 0
			}

			ctx.totalMatchedFiles++
			const dir = path.substring(0, depthSlash)
			ctx.depthPaths.set(dir, (ctx.depthPaths.get(dir) ?? 0) + 1)
			return 1
		}
	}

	const failedPrev = ctx.failed.length
	let match = await target.ignores(fs, cwd, path, ctx)
	if (invert) {
		match.ignored = !match.ignored
	}

	if (failedPrev < ctx.failed.length) {
		if (stream) {
			stream.emit("dirent", { dirent: entry, match, path: direntPath, ctx })
		}
		return 2
	}

	if (match.ignored) {
		if (stream) {
			stream.emit("dirent", { dirent: entry, match, path: direntPath, ctx })
		}
		if (isDir && fastInternal && match.kind === "internal") {
			return 1
		}
		return 0
	}

	if (isDir) {
		// ctx.totalMatchedDirs++;
		// ctx.depthPaths.set(path, (ctx.depthPaths.get(path) ?? 0) + 1);
		const { depth } = getDepth(path, maxDepth)
		if (depth <= maxDepth) {
			ctx.paths.set(direntPath, match)
			if (stream) {
				stream.emit("dirent", { dirent: entry, match, path: direntPath, ctx })
			}
		}
		return 0
	}

	ctx.totalMatchedFiles++
	const { depth, depthSlash } = getDepth(path, maxDepth)
	if (depth > maxDepth) {
		const dir = path.substring(0, depthSlash)
		ctx.depthPaths.set(dir, (ctx.depthPaths.get(dir) ?? 0) + 1)
		return 0
	}

	ctx.paths.set(path, match)
	if (stream) {
		stream.emit("dirent", { dirent: entry, match, path: direntPath, ctx })
	}

	return 0
}
