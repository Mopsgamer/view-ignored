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
	const { opendir, readdir, readFile } = fs.promises
	const adapter = {
		promises: { opendir, readFile, readdir },
		readdir: fs.readdir.bind(fs),
		readFile: fs.readFile.bind(fs),
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
): Promise<void> {
	const cwd = process.cwd() + "/test"
	const vol = Volume.fromNestedJSON(tree, cwd)
	const adapter = createAdapter(vol)
	const o = { cwd: cwd, fs: adapter, ...options } as ScanOptions & { fs: FsAdapter; cwd: string }

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
		stream.addListener("end", async (sctx) => {
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
		})
		try {
			await stream.start()
		} catch (e) {
			done()
			throw e
		}
		return
	}

	let ctx: MatcherContext
	try {
		ctx = await scan(o)
	} catch (e) {
		done()
		throw e
	}
	const { paths } = ctx
	expect(sortFirstFolders(paths.keys())).toStrictEqual(sortFirstFolders(test))

	const stream = scanStream(o)
	const results = new Set<string>()
	stream.addListener("dirent", (dirent) => {
		if (dirent.match.ignored) return
		if (results.has(dirent.path)) results.delete(dirent.path)
		results.add(dirent.path)
	})
	stream.addListener("end", () => {
		try {
			expect(sortFirstFolders(results)).toStrictEqual(sortFirstFolders(test))
		} finally {
			done()
		}
	})
	try {
		await stream.start()
	} catch (e) {
		done()
		throw e
	}
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
