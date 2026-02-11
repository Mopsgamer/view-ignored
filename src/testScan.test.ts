import { expect } from "bun:test"
import * as process from "node:process"

import { createFsFromVolume, Volume, type NestedDirectoryJSON } from "memfs"

import { scan } from "./browser_scan.js"
import { scanStream } from "./browser_stream.js"
import type { MatcherContext } from "./patterns/matcherContext.js"
import { MatcherStream } from "./patterns/matcherStream.js"
import { sortFirstFolders } from "./testSort.test.js"
import type { ScanOptions, FsAdapter } from "./types.js"

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
		stream.addListener("end", async (sctx) => {
			await test({
				vol,
				fs: adapter,
				ctx: sctx,
				options: o,
			})
			done()
		})
		return
	}

	const ctx = await scan(o)
	const { paths } = ctx
	expect(sortFirstFolders(paths.keys())).toStrictEqual(sortFirstFolders(test))

	const stream = scanStream(o)
	const results = new Set<string>()
	stream.addListener("dirent", (dirent) => {
		if (!dirent.match.ignored && !results.has(dirent.path)) results.add(dirent.path)
	})
	stream.addListener("end", () => {
		expect(sortFirstFolders(results)).toStrictEqual(sortFirstFolders(test))
		done()
	})
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
		await test({
			vol,
			fs: adapter,
			stream,
			options: o,
		})
		return
	}
}
