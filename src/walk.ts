import type { Dirent } from "node:fs"

import { dirname } from "node:path/posix"

import type { MatcherContext, Total } from "./patterns/matcherContext.js"
import type { MatcherStream } from "./patterns/matcherStream.js"
import type { Resource } from "./patterns/resource.js"
import type { ScanOptions } from "./types.js"

import { getDepth } from "./getDepth.js"
import { isRuleMatchInvalid, type RuleMatch } from "./patterns/rule.js"

export type WalkOptions = {
	relPath: string
	parentPath: string
	entry: Dirent
	resource: Resource
	stream: MatcherStream | undefined
	scanOptions: Required<ScanOptions>
}

export type WalkResult = {
	match: [path: string, parentPath: string, RuleMatch]
	includeParent: boolean
	tooDeep: boolean
	next: 0 | 1
}

export async function walkIncludes(options: WalkOptions): Promise<WalkResult> {
	const { entry, stream, scanOptions, relPath: path, parentPath, resource } = options

	const { fs, target, cwd, depth: maxDepth, invert, signal, fastDepth, fastInternal } = scanOptions

	signal?.throwIfAborted()

	const isDir = entry.isDirectory()
	let direntPath: string
	if (isDir) {
		direntPath = path + "/"
	} else {
		direntPath = path
	}

	const match = <RuleMatch>{ ignored: false, kind: "none" }
	const result: WalkResult = {
		includeParent: false,
		match: [direntPath, parentPath, match],
		next: 0,
		tooDeep: false,
	}

	if (fastDepth) {
		const { depth } = getDepth(path, maxDepth)
		if (depth > maxDepth) {
			result.tooDeep = true
			Object.assign(
				match,
				await target.ignores({
					cwd,
					entry: path,
					fs,
					parentPath,
					resource,
					signal,
					target,
				}),
			)
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

			result.next = 1
			return result
		}
	}

	Object.assign(
		match,
		await target.ignores({
			cwd,
			entry: path,
			fs,
			parentPath,
			resource,
			signal,
			target,
		}),
	)
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
			if (stream) {
				stream.emit("dirent", { dirent: entry, match, path: direntPath })
			}
		} else {
			result.tooDeep = true
		}
		result.next = 0
		return result
	}

	const { depth } = getDepth(path, maxDepth)
	if (depth > maxDepth) {
		result.tooDeep = true
		result.next = 0
		return result
	}

	const lastSlash = path.lastIndexOf("/")
	if (lastSlash >= 0) {
		const dir = path.substring(0, lastSlash + 1)
		result.includeParent = true
		if (stream) {
			stream.emit("dirent", { dirent: entry, match, path: dir })
		}
	}
	if (stream) {
		stream.emit("dirent", { dirent: entry, match, path: direntPath })
	}

	result.next = 0
	return result
}

/**
 * Patches the {@link MatcherContext} with the given results.
 */
export function walkPatch(ctx: MatcherContext, maxDepth: number, results: WalkResult[]): void {
	for (const r of results) {
		const [path, parentPath, match] = r.match
		const isDir = path.endsWith("/")

		if (isDir) {
			if (!match.ignored) {
				if (!r.tooDeep) ctx.paths.set(path, match)
			}
			fillTotal(maxDepth, ctx.total, path.slice(0, -1), match, 0, 0, 1)
		} else {
			if (!match.ignored) {
				if (!r.tooDeep) ctx.paths.set(path, match)
				fillTotal(maxDepth, ctx.total, parentPath, match, 1, 1, 0)
			} else {
				fillTotal(maxDepth, ctx.total, path, match, 1, 0, 0)
			}
		}
		if (r.includeParent) {
			ctx.paths.set(parentPath + "/", match)
		}
	}
}

export function fillTotal(
	maxDepth: number,
	total: Map<string, Total>,
	dir: string,
	match: RuleMatch,
	addFiles: number,
	addMatchedFiles: number,
	addDirs: number,
): void {
	const dirTotal = total.get(dir)
	let { depth, depthSlash } = getDepth(dir, maxDepth)
	if (dirTotal) {
		dirTotal.totalFiles += addFiles
		dirTotal.totalDirs += addDirs
		dirTotal.totalMatchedFiles += addMatchedFiles
	} else if (depth <= maxDepth && !match.ignored) {
		total.set(dir, { totalDirs: addDirs, totalFiles: addFiles, totalMatchedFiles: addMatchedFiles })
	}
	if (dir === ".") return
	depth--
	for (
		let parent = depthSlash <= 0 ? dirname(dir) : dir.slice(0, depthSlash);
		;
		depth--, parent = dirname(parent)
	) {
		if (depth > maxDepth && parent !== ".") {
			continue
		}
		const parentTotal = total.get(parent)
		if (parentTotal) {
			parentTotal.totalFiles += addFiles
			parentTotal.totalDirs += addDirs
			parentTotal.totalMatchedFiles += addMatchedFiles
		} else if (depth <= maxDepth && !match.ignored) {
			total.set(parent, {
				totalDirs: addDirs,
				totalFiles: addFiles,
				totalMatchedFiles: addMatchedFiles,
			})
		}
		if (parent === ".") break
	}
}
