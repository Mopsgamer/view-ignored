import type { MatcherContext } from "./patterns/matcherContext.js"
import type { RuleMatch } from "./patterns/rule.js"
import type { ScanOptions, FsAdapter, ScanBrowserOptions } from "./types.js"

import { expect } from "bun:test"
import { createFsFromVolume, Volume, type NestedDirectoryJSON } from "memfs"
import * as process from "node:process"

import { scan } from "./browser_scan.js"
import { scanStream } from "./browser_stream.js"
import { MatcherStream } from "./patterns/matcherStream.js"
import { sortFirstFolders } from "./testSort.test.js"

export function createAdapter(vol: Volume): FsAdapter {
	// oxlint-disable-next-line typescript/no-explicit-any
	const fs = createFsFromVolume(vol) as any

	const isSpecial = (filePath: string): { isBlockDevice: boolean; isSocket: boolean } | null => {
		const name = filePath.slice(filePath.lastIndexOf("/") + 1)
		if (name !== "socket" && name !== "device") {
			return null
		}
		try {
			const content = vol.readFileSync(filePath, "utf8")
			if (content === "not a file or dir") {
				const isSocket = name === "socket"
				return { isBlockDevice: !isSocket, isSocket }
			}
		} catch {
			// ignore directories or read errors
		}
		return null
	}

	// oxlint-disable-next-line typescript/no-explicit-any
	const wrappedReaddir = (path: string, options: any, callback: any) => {
		if (typeof options === "function") {
			callback = options
			options = undefined
		}
		// oxlint-disable-next-line typescript/no-explicit-any
		fs.readdir(path, options, (err: any, files: any[]) => {
			if (err) return callback(err)
			if (files && options && options.withFileTypes) {
				for (const file of files) {
					const fullPath = path.endsWith("/") ? path + file.name : path + "/" + file.name
					const special = isSpecial(fullPath)
					if (special) {
						file.isFile = () => false
						file.isSocket = () => special.isSocket
						file.isBlockDevice = () => special.isBlockDevice
					}
				}
			}
			callback(null, files)
		})
	}

	// oxlint-disable-next-line typescript/no-explicit-any
	const wrappedStat = (path: string, options: any, callback: any) => {
		if (typeof options === "function") {
			callback = options
			options = undefined
		}
		// oxlint-disable-next-line typescript/no-explicit-any
		fs.stat(path, options, (err: any, stats: any) => {
			if (err) return callback(err)
			if (stats) {
				const special = isSpecial(path)
				if (special) {
					stats.isFile = () => false
					stats.isSocket = () => special.isSocket
					stats.isBlockDevice = () => special.isBlockDevice
				}
			}
			callback(null, stats)
		})
	}

	const adapter: FsAdapter = {
		readFile: fs.readFile.bind(fs),
		// oxlint-disable-next-line typescript/no-explicit-any
		readdir: wrappedReaddir as any,
		// oxlint-disable-next-line typescript/no-explicit-any
		stat: wrappedStat as any,
	}
	return adapter
}

export type PathHandlerOptions = {
	vol: Volume
	fs: FsAdapter
	ctx: MatcherContext
	options: ScanOptions
}

export type PathHandlerOptionsStream = {
	vol: Volume
	fs: FsAdapter
	stream: MatcherStream
	options: ScanOptions
}

/**
 * Executes tests within './test'.
 */
export async function testScan(
	done: () => void,
	tree: NestedDirectoryJSON,
	test: ((o: PathHandlerOptions) => void | Promise<void>) | string[],
	options: ScanOptions,
	symlinks?: Record<string, string>,
): Promise<void> {
	const cwd = process.cwd() + "/test"
	const vol = Volume.fromNestedJSON(tree, cwd)

	if (symlinks) {
		for (const [path, target] of Object.entries(symlinks)) {
			vol.symlinkSync(target, cwd + "/" + path)
		}
	}

	const adapter = createAdapter(vol)
	const o = { cwd: cwd, fs: adapter, ...options } as ScanBrowserOptions

	if (typeof test === "function") {
		let ctx: MatcherContext
		try {
			ctx = await scan(o)
		} catch (e) {
			done()
			throw e
		}
		await test({
			ctx,
			fs: adapter,
			options: o,
			vol,
		})
		const stream = scanStream(o)
		stream.addEventListener(
			"end",
			async ({ detail: sctx }) => {
				try {
					await test({
						ctx: sctx,
						fs: adapter,
						options: o,
						vol,
					})
				} finally {
					done()
				}
			},
			{ once: true },
		)
		try {
			await stream.start()
		} catch (e) {
			done()
			throw e
		}
		return
	}

	const ctx = await scan(o)
	comparePaths(false, ctx, test)

	const stream = scanStream(o)
	const results = new Set<string>()
	stream.addEventListener("dirent", ({ detail: dirent }) => {
		const { invert = false } = o
		const isExcluded =
			invert === true ? !dirent.match.ignored : invert === 2 ? false : dirent.match.ignored
		if (isExcluded) return
		if (results.has(dirent.path)) results.delete(dirent.path)
		results.add(dirent.path)
	})
	stream.addEventListener(
		"end",
		() => {
			try {
				comparePaths(true, ctx, test)
			} finally {
				done()
			}
		},
		{ once: true },
	)
	await stream.start()
}

function pathsToDebug([k, v]: [string, RuleMatch]) {
	return [
		k,
		{
			ignored: v.ignored,
			kind: RMK[v.kind],
			...(v.kind === 6
				? {
						pattern: v.pattern,
					}
				: {}),
		},
	] as const
}

function comparePaths(stream: boolean, ctx: MatcherContext, test: string[]): void {
	try {
		expect(sortFirstFolders(ctx.paths.keys())).toStrictEqual(sortFirstFolders(test))
	} catch (e) {
		const prefix = stream ? "scanStream" : "stream"
		if (ctx.paths.size) {
			const map = Array.from(ctx.paths.entries()).map(pathsToDebug)
			console.error(
				`${prefix}: ctx.paths (debug):\x1b[0m ` + Bun.inspect(new Map(map), { colors: true }),
			)
		} else
			console.error(
				`${prefix}: no paths, ctx.external:\x1b[0m ` + Bun.inspect(ctx.external, { colors: true }),
			)
		if (ctx.failed.length) console.error("Contains failed sources:", ctx.failed)
		throw e
	}
}

enum RMK {
	none,
	missingSource,
	noMatch,
	invalidSource,
	invalidExternal,
	invalidInternal,
	external,
	internal,
}

/**
 * Executes tests within './test'.
 */
export async function testStream(
	tree: NestedDirectoryJSON,
	test: (o: PathHandlerOptionsStream) => void | Promise<void>,
	options: ScanOptions,
): Promise<void> {
	const cwd = process.cwd() + "/test"
	const vol = Volume.fromNestedJSON(tree, cwd)
	const adapter = createAdapter(vol)
	const o = { cwd: cwd, fs: adapter, ...options } as ScanBrowserOptions

	if (typeof test === "function") {
		const stream = scanStream(o)
		const promise = test({
			fs: adapter,
			options: o,
			stream,
			vol,
		})
		await stream.start()
		await promise
		return
	}
}
