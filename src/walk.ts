import type { Dirent } from "node:fs"

import type { Resource } from "./patterns/matcherContext.js"
import type { MatcherStream } from "./patterns/matcherStream.js"
import type { ScanOptions } from "./types.js"

import { getDepth } from "./getDepth.js"
import { isRuleMatchInvalid, type RuleMatch } from "./patterns/rule.js"

export type WalkOptions = {
	path: string
	parentPath: string
	entry: Dirent
	external: Map<string, Resource>
	stream: MatcherStream | undefined
	scanOptions: Required<ScanOptions>
}

export type WalkResult = {
	addFail: Error | undefined
	addToPaths: [string, RuleMatch] | undefined
	addToMatchedFiles: boolean
	addToMatchedDirs: boolean
	addDepthPathDir: string | undefined
	parentMustBeIncluded: boolean
	next: 0 | 1 | 2
}

export async function walkIncludes(options: WalkOptions): Promise<WalkResult> {
	const { entry, stream, scanOptions, path, parentPath, external } = options

	const { fs, target, cwd, depth: maxDepth, invert, signal, fastDepth, fastInternal } = scanOptions

	const result: WalkResult = {
		addFail: undefined,
		addToPaths: undefined,
		addToMatchedFiles: false,
		addToMatchedDirs: false,
		addDepthPathDir: undefined,
		parentMustBeIncluded: false,
		next: 0,
	}

	signal?.throwIfAborted()

	const isDir = entry.isDirectory()
	let direntPath: string
	if (isDir) {
		direntPath = path + "/"
		result.addToMatchedFiles = true
	} else {
		direntPath = path
		result.addToMatchedDirs = true
	}

	if (fastDepth) {
		const { depth, depthSlash } = getDepth(path, maxDepth)
		if (depth > maxDepth) {
			let match = await target.ignores({
				fs,
				cwd,
				entry: path,
				signal,
				target,
				parentPath,
				external,
			})
			if (invert) {
				match.ignored = !match.ignored
			}

			if (isRuleMatchInvalid(match)) {
				if (stream) {
					stream.emit("dirent", { dirent: entry, match, path: direntPath })
				}
				result.next = 2
				return result
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

			result.addToMatchedFiles = true
			const dir = path.substring(0, depthSlash)
			result.addDepthPathDir = dir
			result.next = 1
			return result
		}
	}

	let match = await target.ignores({
		fs,
		cwd,
		entry: path,
		external,
		signal,
		target,
		parentPath: parentPath,
	})
	if (invert) {
		match.ignored = !match.ignored
	}

	if (isRuleMatchInvalid(match)) {
		if (stream) {
			stream.emit("dirent", { dirent: entry, match, path: direntPath })
		}
		result.next = 2
		return result
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

	result.addToMatchedFiles = true
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
			result.parentMustBeIncluded = true
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
