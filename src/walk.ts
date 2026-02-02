import type { Dirent } from "fs"
import type { MatcherContext } from "./patterns/matcherContext.js"
import type { MatcherStream } from "./patterns/matcherStream.js"
import type { ScanOptions } from "./types.js"
import { posix } from "path/posix"
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

	const path = posix.join(posix.relative(cwd, entry.parentPath.replaceAll("\\", "/")), entry.name)

	const isDir = entry.isDirectory()
	if (isDir) {
		ctx.totalDirs++
	} else {
		ctx.totalFiles++
	}

	if (fastDepth) {
		const { depth, depthSlash } = getDepth(path, maxDepth)
		if (depth > maxDepth) {
			let match = await target.ignores(fs, cwd, path, ctx)
			if (invert) {
				match.ignored = !match.ignored
			}

			if (ctx.failed) {
				if (stream) {
					stream.emit("dirent", { dirent: entry, match, path, ctx })
				}
				return 2
			}

			if (match.ignored) {
				if (stream) {
					stream.emit("dirent", { dirent: entry, match, path, ctx })
				}
				if (isDir && fastInternal && match.kind === "internal") {
					return 1
				}
				return 0
			}

			if (isDir) {
				// ctx.totalMatchedDirs++;
				// ctx.depthPaths.set(path, (ctx.depthPaths.get(path) ?? 0) + 1);
				if (stream) {
					stream.emit("dirent", { dirent: entry, match, path, ctx })
				}
				return 0
			}

			ctx.totalMatchedFiles++
			const dir = path.substring(0, depthSlash)
			ctx.depthPaths.set(dir, (ctx.depthPaths.get(dir) ?? 0) + 1)
			if (stream) {
				stream.emit("dirent", { dirent: entry, match, path, ctx })
			}
			return 1
		}
	}

	let match = await target.ignores(fs, cwd, path, ctx)
	if (invert) {
		match.ignored = !match.ignored
	}

	if (ctx.failed) {
		if (stream) {
			stream.emit("dirent", { dirent: entry, match, path, ctx })
		}
		return 2
	}

	if (match.ignored) {
		if (stream) {
			stream.emit("dirent", { dirent: entry, match, path, ctx })
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
			ctx.paths.add(path + "/")
		}
		if (stream) {
			stream.emit("dirent", { dirent: entry, match, path, ctx })
		}
		return 0
	}

	ctx.totalMatchedFiles++
	const { depth, depthSlash } = getDepth(path, maxDepth)
	if (depth > maxDepth) {
		const dir = path.substring(0, depthSlash)
		ctx.depthPaths.set(dir, (ctx.depthPaths.get(dir) ?? 0) + 1)
	} else {
		ctx.paths.add(path)
	}

	if (stream) {
		stream.emit("dirent", { dirent: entry, match, path, ctx })
	}

	return 0
}
