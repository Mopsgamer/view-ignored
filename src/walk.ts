import type { Dirent } from "fs"
import { posix } from "path/posix"
import { getDepth } from "./getdepth.js"
import type { MatcherContext } from "./patterns/matcher_context.js"
import type { MatcherStream, ScanOptions, EntryInfo } from "./scan.js"

export type WalkOptions = {
	entry: Dirent
	ctx: MatcherContext
	s: MatcherStream
} & ScanOptions &
	Omit<Required<ScanOptions>, "signal">

export async function walk(options: WalkOptions): Promise<0 | 1 | 2> {
	const { entry, ctx, s, target, cwd, depth: maxDepth, invert, signal, fastDepth, stream } = options

	signal?.throwIfAborted()

	const path = posix.join(posix.relative(cwd, entry.parentPath.replaceAll("\\", "/")), entry.name)

	const isDir = entry.isDirectory()
	if (isDir) {
		ctx.totalDirs++
	} else {
		ctx.totalFiles++
	}

	if (fastDepth) {
		// TODO: perf fastDepth check
		const { depth, depthSlash } = getDepth(path, maxDepth) // TODO: perf depth check
		if (depth > maxDepth) {
			let ignored = await target.ignores(cwd, path, ctx)
			if (ctx.failed) {
				if (stream) {
					// TODO: perf stream check
					s.emit("dirent", { dirent: entry, ignored, path } as EntryInfo)
				}
				return 2
			}

			if (invert) {
				// TODO: perf invert check
				ignored = !ignored
			}

			if (ignored) {
				if (stream) {
					// TODO: perf stream check
					s.emit("dirent", { dirent: entry, ignored, path } as EntryInfo)
				}
				return 0
			}

			if (isDir) {
				// ctx.totalMatchedDirs++;
				// ctx.depthPaths.set(path, (ctx.depthPaths.get(path) ?? 0) + 1);
				if (stream) {
					// TODO: perf stream check
					s.emit("dirent", { dirent: entry, ignored, path } as EntryInfo)
				}
				return 0
			}

			ctx.totalMatchedFiles++
			const dir = path.substring(0, depthSlash)
			ctx.depthPaths.set(dir, (ctx.depthPaths.get(dir) ?? 0) + 1)
			if (stream) {
				s.emit("dirent", { dirent: entry, ignored, path } as EntryInfo)
			}
			return 1
		}
	}

	let ignored = await target.ignores(cwd, path, ctx)
	if (ctx.failed) {
		if (stream) {
			// TODO: perf stream check
			s.emit("dirent", { dirent: entry, ignored, path } as EntryInfo)
		}
		return 2
	}

	if (invert) {
		// TODO: perf invert check
		ignored = !ignored
	}

	if (ignored) {
		if (stream) {
			// TODO: perf stream check
			s.emit("dirent", { dirent: entry, ignored, path } as EntryInfo)
		}
		return 0
	}

	if (isDir) {
		// ctx.totalMatchedDirs++;
		// ctx.depthPaths.set(path, (ctx.depthPaths.get(path) ?? 0) + 1);
		const { depth } = getDepth(path, maxDepth) // TODO: perf depth check
		if (depth <= maxDepth) {
			ctx.paths.add(path + "/")
		}
		if (stream) {
			// TODO: perf stream check
			s.emit("dirent", { dirent: entry, ignored, path } as EntryInfo)
		}
		return 0
	}

	ctx.totalMatchedFiles++
	const { depth, depthSlash } = getDepth(path, maxDepth) // TODO: perf depth check
	if (depth > maxDepth) {
		const dir = path.substring(0, depthSlash)
		ctx.depthPaths.set(dir, (ctx.depthPaths.get(dir) ?? 0) + 1)
	} else {
		ctx.paths.add(path)
	}

	if (stream) {
		// TODO: perf stream check
		s.emit("dirent", { dirent: entry, ignored, path } as EntryInfo)
	}
	return 0
}
