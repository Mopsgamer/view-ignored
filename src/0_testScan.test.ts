import type { ScanOptions, FsAdapter } from "./types.js"
import type { MatcherContext } from "./patterns/matcherContext.js"
import { deepEqual } from "node:assert/strict"
import { createFsFromVolume, Volume, type NestedDirectoryJSON } from "memfs"
import { cwd } from "node:process"
import { scan } from "./browser_scan.js"
import { MatcherStream } from "./patterns/matcherStream.js"
import { scanStream } from "./browser_stream.js"
import { sortFirstFolders } from "./0_testSort.test.js"

export const memcwd = cwd().replace(/\w:/, "").replaceAll("\\", "/")

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
			fs: adapter,
			ctx,
			options: o,
		})
		return
	}

	const ctx = await scan(o)
	const { paths: set } = ctx
	let paths = sortFirstFolders(set)
	deepEqual(paths, sortFirstFolders(test))

	const stream = scanStream(o)
	const results: string[] = []
	stream.addListener("dirent", (dirent) => {
		if (!dirent.match.ignored) results.push(dirent.path)
	})
	stream.addListener("end", () => {
		paths = sortFirstFolders(results)
		deepEqual(paths, sortFirstFolders(test))
		done()
	})
}

/**
 * Executes tests within './test'.
 */
export async function testStream(
	done: () => void,
	tree: NestedDirectoryJSON,
	test: ((o: PathHandlerOptionsStream) => void | Promise<void>) | string[],
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
			fs: adapter,
			stream,
			options: o,
		})
		return
	}

	const stream = scanStream(o)
	const results: string[] = []
	stream.addListener("dirent", (dirent) => {
		if (!dirent.match.ignored) results.push(dirent.path)
	})
	stream.addListener("end", () => {
		const paths = sortFirstFolders(results)
		deepEqual(paths, sortFirstFolders(test))
		done()
	})
}
