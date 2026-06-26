import type { MatcherContext } from "./patterns/matcherContext.js"
import type { ScanOptions, FsAdapter, ScanBrowserOptions } from "./types.js"

import { expect } from "bun:test"
import { createFsFromVolume, Volume, type NestedDirectoryJSON } from "memfs"
import * as process from "node:process"

import { scan } from "./browser_scan.js"
import { scanStream } from "./browser_stream.js"
import { MatcherStream } from "./patterns/matcherStream.js"
import { sortFirstFolders } from "./testSort.test.js"

export function createAdapter(vol: Volume): FsAdapter {
	const fs = createFsFromVolume(vol)
	const adapter = {
		readFile: fs.readFile.bind(fs),
		readdir: fs.readdir.bind(fs),
	} as unknown as FsAdapter
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
	const { paths, failed } = ctx
	try {
		expect(sortFirstFolders(paths.keys())).toStrictEqual(sortFirstFolders(test))
	} catch (e) {
		if (ctx.paths.size) {
			const map = Array.from(ctx.paths.entries()).map(
				([k, v]) => [k, { ignored: v.ignored, kind: RMK[v.kind] }] as const,
			)
			console.error("scan: ctx.paths (debug): " + Bun.inspect(new Map(map), { colors: true }))
		} else
			console.error("scan: no paths, ctx.external: " + Bun.inspect(ctx.external, { colors: true }))
		if (failed.length) console.error("Contains failed sources:", failed)
		throw e
	}

	const stream = scanStream(o)
	const results = new Set<string>()
	stream.addEventListener("dirent", ({ detail: dirent }) => {
		if (dirent.match.ignored) return
		if (results.has(dirent.path)) results.delete(dirent.path)
		results.add(dirent.path)
	})
	stream.addEventListener(
		"end",
		() => {
			try {
				expect(sortFirstFolders(results)).toStrictEqual(sortFirstFolders(test))
			} catch (e) {
				if (ctx.paths.size) {
					const map = Array.from(ctx.paths.entries()).map(
						([k, v]) => [k, { ignored: v.ignored, kind: RMK[v.kind] }] as const,
					)
					console.error(
						"scanStream: ctx.paths (debug): " + Bun.inspect(new Map(map), { colors: true }),
					)
				} else
					console.error(
						"scanStream: no paths, ctx.external: " + Bun.inspect(ctx.external, { colors: true }),
					)
				if (failed.length) console.error("Contains failed sources:", failed)
				throw e
			} finally {
				done()
			}
		},
		{ once: true },
	)
	await stream.start()
}

enum RMK {
	"none",
	"missingSource",
	"noMatch",
	"invalidSource",
	"invalidExternal",
	"invalidInternal",
	"external",
	"internal",
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
