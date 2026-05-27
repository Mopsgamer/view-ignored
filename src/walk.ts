import type { Dirent } from "node:fs"

import type { MatcherContext, Total } from "./patterns/matcherContext.js"
import type { MatcherStream } from "./patterns/matcherStream.js"
import type { Resource } from "./patterns/resource.js"
import type { ScanOptions } from "./types.js"

import { isRuleMatchInvalid, type RuleMatch } from "./patterns/rule.js"

export type WalkOptions = {
	relPath: string
	lowerRelPath?: string
	parentPath: string
	entry: Dirent
	resource: Resource
	stream: MatcherStream | undefined
	scanOptions: Required<ScanOptions>
	depth: number
}

export type WalkResult = {
	path: string
	parentPath: string
	match: RuleMatch
	includeParent: boolean
	tooDeep: boolean
	next: 0 | 1
	depth: number
	isDir: boolean
}

export type WalkTotal = {
	type?: "total"
	dir: string
	files: number
	matched: number
	dirs: number
	depth: number
	ignored: boolean
}

/**
 * @since 0.11.0
 */
export function walkIncludes(
	options: WalkOptions,
	cb: (err: Error | null, result: WalkResult) => void,
): void {
	const {
		entry,
		stream,
		scanOptions,
		relPath: path,
		lowerRelPath,
		parentPath,
		resource,
		depth,
	} = options
	const { target, depth: maxDepth, invert, fastDepth, fastInternal, fs, cwd, signal } = scanOptions

	const isDir = entry.isDirectory()
	const direntPath = isDir ? path + "/" : path
	const lowerEntry = lowerRelPath || path.toLowerCase()

	const testOptions = {
		cwd,
		entry: path,
		fs,
		lowerEntry,
		parentPath,
		resource,
		signal,
		target,
	}

	if (fastDepth && depth > maxDepth) {
		return target.ignores(testOptions, (err, match) => {
			if (err) return cb(err, null as any)
			if (invert) match = { ...match, ignored: !match.ignored }
			const result: WalkResult = {
				depth,
				includeParent: false,
				isDir,
				match,
				next: 0,
				parentPath,
				path: direntPath,
				tooDeep: true,
			}
			if (isRuleMatchInvalid(match)) {
				if (stream) {
					stream.dispatchEvent(
						new CustomEvent("dirent", { detail: { dirent: entry, match, path: direntPath } }),
					)
				}
				return cb(null, result)
			}
			if (match.ignored) {
				if (stream)
					stream.dispatchEvent(
						new CustomEvent("dirent", { detail: { dirent: entry, match, path: direntPath } }),
					)
				if (isDir && fastInternal) result.next = 1
				return cb(null, result)
			}
			result.next = isDir ? 0 : 1
			cb(null, result)
		})
	}

	target.ignores(testOptions, (err, match) => {
		if (err) return cb(err, null as any)

		if (invert) match = { ...match, ignored: !match.ignored }

		const result: WalkResult = {
			depth,
			includeParent: false,
			isDir,
			match,
			next: 0,
			parentPath,
			path: direntPath,
			tooDeep: false,
		}

		if (isRuleMatchInvalid(match)) {
			if (stream)
				stream.dispatchEvent(
					new CustomEvent("dirent", { detail: { dirent: entry, match, path: direntPath } }),
				)
			return cb(null, result)
		}

		if (match.ignored) {
			if (stream)
				stream.dispatchEvent(
					new CustomEvent("dirent", { detail: { dirent: entry, match, path: direntPath } }),
				)
			if (isDir && fastInternal) result.next = 1
			return cb(null, result)
		}

		if (isDir) {
			if (depth <= maxDepth) {
				if (stream)
					stream.dispatchEvent(
						new CustomEvent("dirent", { detail: { dirent: entry, match, path: direntPath } }),
					)
			} else {
				result.tooDeep = true
			}
			return cb(null, result)
		}

		if (depth > maxDepth) {
			result.tooDeep = true
			return cb(null, result)
		}

		const lastSlash = path.lastIndexOf("/")
		if (lastSlash >= 0) result.includeParent = true

		if (stream) {
			if (result.includeParent)
				stream.dispatchEvent(
					new CustomEvent("dirent", { detail: { dirent: entry, match, path: parentPath + "/" } }),
				)
			stream.dispatchEvent(
				new CustomEvent("dirent", { detail: { dirent: entry, match, path: direntPath } }),
			)
		}

		cb(null, result)
	})
}

/**
 * Patches the {@link MatcherContext} with the given result.
 */
export function walkPatchResult(ctx: MatcherContext, r: WalkResult): void {
	const { path, parentPath, match, isDir, tooDeep, includeParent } = r
	if (isDir) {
		if (!match.ignored && !tooDeep) ctx.paths.set(path, match)
	} else {
		if (!match.ignored) {
			if (!tooDeep) ctx.paths.set(path, match)
		}
	}
	if (includeParent && !match.ignored)
		if (!ctx.paths.has(parentPath + "/")) ctx.paths.set(parentPath + "/", match)
}

/**
 * Patches the {@link MatcherContext} with the given total.
 */
export function walkPatchTotal(ctx: MatcherContext, maxDepth: number, t: WalkTotal): void {
	const { dir, files, matched, dirs, ignored } = t
	const dirTotal = ctx.total.get(dir)
	if (dirTotal) {
		dirTotal.totalFiles += files
		dirTotal.totalDirs += dirs
		dirTotal.totalMatchedFiles += matched
	} else if (t.depth <= maxDepth && !ignored) {
		ctx.total.set(dir, { totalDirs: dirs, totalFiles: files, totalMatchedFiles: matched })
	}
}

/**
 * Propagates totals from child directories to their parents.
 */
export function propagateTotals(total: Map<string, Total>): void {
	const dirs = Array.from(total.keys()).sort((a, b) => b.length - a.length)
	for (let i = 0, len = dirs.length; i < len; i++) {
		const dir = dirs[i]!
		if (dir === "." || dir === "/") continue
		const dirTotal = total.get(dir)!
		const lastSlash = dir.lastIndexOf("/")
		const parent = lastSlash === -1 ? "." : dir.slice(0, lastSlash) || "/"
		const parentTotal = total.get(parent)
		if (parentTotal) {
			parentTotal.totalFiles += dirTotal.totalFiles
			parentTotal.totalDirs += dirTotal.totalDirs
			parentTotal.totalMatchedFiles += dirTotal.totalMatchedFiles
		} else {
			total.set(parent, {
				totalDirs: dirTotal.totalDirs,
				totalFiles: dirTotal.totalFiles,
				totalMatchedFiles: dirTotal.totalMatchedFiles,
			})
		}
	}
}
