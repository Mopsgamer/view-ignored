import { expect } from "bun:test"
import { createFsFromVolume, Volume, type NestedDirectoryJSON } from "memfs"
import * as process from "node:process"

import type { MatcherContext } from "./patterns/matcherContext.js"
import type { ScanOptions, FsAdapter } from "./types.js"

import { scan } from "./browser_scan.js"
import { scanStream } from "./browser_stream.js"
import { MatcherStream } from "./patterns/matcherStream.js"
import { sortFirstFolders } from "./testSort.test.js"

export function createAdapter(vol: Volume): FsAdapter {
	const fs = createFsFromVolume(vol)
	const { opendir, readFile } = fs.promises
	const adapter = { promises: { opendir, readFile } } as FsAdapter
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
): Promise<void> {
	const cwd = process.cwd() + "/test"
	const vol = Volume.fromNestedJSON(tree, cwd)
	const adapter = createAdapter(vol)
	const o = { cwd: cwd, fs: adapter, ...options } as ScanOptions & { fs: FsAdapter; cwd: string }

	if (typeof test === "function") {
		const ctx = await scan(o)
		await test({
			vol,
			fs: adapter,
			ctx,
			options: o,
		})
		const stream = scanStream(o)
		const streamPromise = new Promise<void>((resolve, reject) => {
			stream.addListener("end", async (sctx) => {
				try {
					await test({
						vol,
						fs: adapter,
						ctx: sctx,
						options: o,
					})
					resolve()
				} catch (e) {
					reject(e)
				}
			})
		})
		await stream.start()
		await streamPromise
		done()
		return
	}

	const ctx = await (async () => {
		try {
			return await scan(o)
		} catch (e) {
			done()
			throw e
		}
	})()
	const { paths } = ctx
	expect(sortFirstFolders(paths.keys())).toStrictEqual(sortFirstFolders(test))

	const stream = scanStream(o)
	const results = new Set<string>()
	stream.addListener("dirent", (dirent) => {
		if (dirent.match.ignored) return
		if (results.has(dirent.path)) results.delete(dirent.path)
		results.add(dirent.path)
	})
	const streamPromise = new Promise<void>((resolve) => {
		stream.addListener("end", () => {
			expect(sortFirstFolders(results)).toStrictEqual(sortFirstFolders(test))
			resolve()
		})
	})
	await stream.start()
	await streamPromise
	done()
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
	const o = { cwd: cwd, fs: adapter, ...options } as ScanOptions & { fs: FsAdapter; cwd: string }

	if (typeof test === "function") {
		const stream = scanStream(o)
		const promise = test({
			vol,
			fs: adapter,
			stream,
			options: o,
		})
		await stream.start()
		await promise
		return
	}
}
