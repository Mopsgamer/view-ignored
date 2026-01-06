import type { ScanOptions } from "./types.js"
import type { FsAdapter } from "./fs_adapter.js"
import type { MatcherContext } from "./patterns/matcher_context.js"
import { deepEqual } from "node:assert/strict"
import { createFsFromVolume, Volume, type NestedDirectoryJSON } from "memfs"
import { cwd } from "node:process"
import { scan } from "./browser_scan.js"
import { MatcherStream } from "./patterns/matcher_stream.js"
import { scanStream } from "./browser_stream.js"
import { sortFirstFolders } from "./testSort.test.js"

export const memcwd = cwd().replace(/\w:/, "").replaceAll("\\", "/")

export type PathHandlerOptions = {
	vol: Volume
	fsp: FsAdapter
	ctx: MatcherContext
	options: ScanOptions
}

export type PathHandlerOptionsStream = {
	vol: Volume
	fsp: FsAdapter
	stream: MatcherStream
	options: ScanOptions
}

/**
 * Executes tests within './test'.
 */
export async function testScan(
	tree: NestedDirectoryJSON,
	test: ((o: PathHandlerOptions) => void | Promise<void>) | string[],
	options: ScanOptions,
): Promise<void> {
	const vol = new Volume()
	const cwd = memcwd + "/test"
	vol.fromNestedJSON(tree, cwd)
	const fs = createFsFromVolume(vol)
	const { opendir, readFile } = fs.promises
	const adapter = { promises: { opendir, readFile } } as FsAdapter
	const o = { cwd: cwd, fs: adapter, ...options } as ScanOptions & { fs: FsAdapter; cwd: string }

	if (typeof test === "function") {
		const ctx = await scan(o)
		await test({
			vol,
			fsp: adapter,
			ctx,
			options: o,
		})
		return
	}

	const ctx = await scan(o)
	const { paths: set } = ctx
	const paths = sortFirstFolders(set)
	deepEqual(paths, sortFirstFolders(test))
}

/**
 * Executes tests within './test'.
 */
export async function testStream(
	tree: NestedDirectoryJSON,
	test: (o: PathHandlerOptionsStream) => void | Promise<void>,
	options: ScanOptions,
): Promise<void> {
	const vol = new Volume()
	const cwd = memcwd + "/test"
	vol.fromNestedJSON(tree, cwd)
	const fs = createFsFromVolume(vol)
	const { opendir, readFile } = fs.promises
	const adapter = { promises: { opendir, readFile } } as FsAdapter
	const o = { cwd: cwd, fs: adapter, ...options } as ScanOptions & { fs: FsAdapter; cwd: string }

	if (typeof test === "function") {
		const stream = scanStream(o)
		await test({
			vol,
			fsp: adapter,
			stream,
			options: o,
		})
		return
	}
}
