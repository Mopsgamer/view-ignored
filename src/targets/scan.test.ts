import { deepEqual } from "node:assert/strict"
import { createFsFromVolume, Volume, type NestedDirectoryJSON } from "memfs"
import { cwd } from "node:process"
import { MatcherStream, scan, type ScanOptions } from "../scan.js"
import type { FsAdapter } from "../fs_adapter.js"
import type { MatcherContext } from "../patterns/matcher_context.js"

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
	s: MatcherStream
	options: ScanOptions & { stream: true }
}

/**
 * Executes tests within './test'.
 */
export async function testScan(
	tree: NestedDirectoryJSON,
	test: (o: PathHandlerOptionsStream) => void | Promise<void>,
	options: ScanOptions & { stream: true },
): Promise<void>
/**
 * Executes tests within './test'.
 */
export async function testScan(
	tree: NestedDirectoryJSON,
	test: ((o: PathHandlerOptions) => void | Promise<void>) | string[],
	options: ScanOptions,
): Promise<void>
/**
 * Executes tests within './test'.
 */
export async function testScan(
	tree: NestedDirectoryJSON,
	test:
		| ((o: PathHandlerOptionsStream) => void | Promise<void>)
		| ((o: PathHandlerOptions) => void | Promise<void>)
		| string[],
	options: ScanOptions,
): Promise<void> {
	const vol = new Volume()
	const cwd = memcwd + "/test"
	vol.fromNestedJSON(tree, cwd)
	const fs = createFsFromVolume(vol)
	const { opendir, readFile } = fs.promises
	const adapter = { promises: { opendir, readFile } } as FsAdapter
	const o = { cwd: cwd, fs: adapter, ...options } as ScanOptions

	if (typeof test === "function") {
		if (o.stream) {
			const os = o as ScanOptions & { stream: true }
			const s = await scan(os)
			await (test as unknown as (o: PathHandlerOptionsStream) => void | Promise<void>)({
				vol,
				fsp: adapter,
				s,
				options: os,
			})
		} else {
			const ctx = await scan(o)
			await (test as unknown as (o: PathHandlerOptions) => void | Promise<void>)({
				vol,
				fsp: adapter,
				ctx,
				options: o,
			})
		}
		return
	}

	const ctx = await scan(o)
	const { paths: set } = ctx
	const paths = [...set]
	deepEqual(paths, test)
}
