import type { Dirent } from "fs"
import type { MatcherContext } from "./patterns/matcher_context.js"
import type { MatcherStream } from "./patterns/matcher_stream.js"
import type { ScanOptions } from "./types.js"
import { posix } from "path/posix"
import { getDepth } from "./getdepth.js"

export type WalkOptions = {
	entry: Dirent
	ctx: MatcherContext
	s: MatcherStream | undefined
	signal: AbortSignal | undefined
} & Omit<Required<ScanOptions>, "signal">

export async function walk(options: WalkOptions): Promise<0 | 1 | 2> {
	const { entry, ctx, s, target, cwd, depth: maxDepth, invert, signal, fastDepth } = options

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
			let ignored = await target.ignores(cwd, path, ctx)
			if (ctx.failed) {
				if (s) {
					s.emit("dirent", { dirent: entry, ignored, path, ctx })
				}
				return 2
			}

			if (invert) {
				ignored = !ignored
			}

			if (ignored) {
				if (s) {
					s.emit("dirent", { dirent: entry, ignored, path, ctx })
				}
				return 0
			}

			if (isDir) {
				// ctx.totalMatchedDirs++;
				// ctx.depthPaths.set(path, (ctx.depthPaths.get(path) ?? 0) + 1);
				if (s) {
					s.emit("dirent", { dirent: entry, ignored, path, ctx })
				}
				return 0
			}

			ctx.totalMatchedFiles++
			const dir = path.substring(0, depthSlash)
			ctx.depthPaths.set(dir, (ctx.depthPaths.get(dir) ?? 0) + 1)
			if (s) {
				s.emit("dirent", { dirent: entry, ignored, path, ctx })
			}
			return 1
		}
	}

	let ignored = await target.ignores(cwd, path, ctx)
	if (ctx.failed) {
		if (s) {
			s.emit("dirent", { dirent: entry, ignored, path, ctx })
		}
		return 2
	}

	if (invert) {
		ignored = !ignored
	}

	if (ignored) {
		if (s) {
			s.emit("dirent", { dirent: entry, ignored, path, ctx })
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
		if (s) {
			s.emit("dirent", { dirent: entry, ignored, path, ctx })
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

	if (s) {
		s.emit("dirent", { dirent: entry, ignored, path, ctx })
	}
	return 0
}
