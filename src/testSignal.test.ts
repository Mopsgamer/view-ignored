import type { Dirent } from "node:fs"

import type { FsAdapter } from "./types.js"

import { describe, test, expect } from "bun:test"

import { scan } from "./scan.js"
import { makeGit } from "./targets/git.js"

describe("signal option", () => {
	// We can't easily test AbortSignal with testScan because it's async and depends on timing.
	// But we can try to use a signal that is already aborted.

	test("aborted signal should throw", async () => {
		const controller = new AbortController()
		controller.abort("reason")
		const { signal } = controller

		// resolveSources.ts returns signal.reason as error
		expect(scan({ signal, target: makeGit() })).rejects.toBe("reason")
	})

	test("aborting signal mid-scan should reject immediately and halt operations", async () => {
		const controller = new AbortController()
		let readdirCallsAfterAbort = 0

		const mockFs = {
			readFile(_path: unknown, cb: (err: Error | null, res: Buffer | null) => void) {
				setTimeout(() => {
					// oxlint-disable-next-line typescript/no-explicit-any
					cb({ code: "ENOENT" } as any, null)
				}, 50)
			},
			readdir(_path: unknown, _options: unknown, cb?: unknown) {
				const callback = (typeof _options === "function" ? _options : cb) as (
					err: Error | null,
					entries?: Dirent[],
				) => void
				if (controller.signal.aborted) {
					readdirCallsAfterAbort++
				}
				setTimeout(() => {
					if (controller.signal.aborted) {
						readdirCallsAfterAbort++
					}
					const fakeDirent = (name: string, isDir: boolean): Dirent =>
						({
							isBlockDevice: () => false,
							isCharacterDevice: () => false,
							isDirectory: () => isDir,
							isFIFO: () => false,
							isFile: () => !isDir,
							isSocket: () => false,
							isSymbolicLink: () => false,
							name,
						}) as Dirent

					const entries = [
						fakeDirent("dir1", true),
						fakeDirent("dir2", true),
						fakeDirent("file1.js", false),
					]
					callback(null, entries)
				}, 50)
			},
			stat(_path: unknown, cb: (err: Error | null, res: unknown) => void) {
				setTimeout(() => {
					// oxlint-disable-next-line typescript/no-explicit-any
					cb({ code: "ENOENT" } as any, null)
				}, 50)
			},
		} as unknown as FsAdapter

		const promise = scan({
			cwd: "/root",
			fs: mockFs,
			signal: controller.signal,
			target: makeGit(),
		})

		// Abort mid-scan after 20ms while readdir is pending
		setTimeout(() => {
			controller.abort("aborted mid-scan")
		}, 20)

		// oxlint-disable-next-line typescript/await-thenable
		await expect(promise).rejects.toBe("aborted mid-scan")

		// Wait a bit more to ensure pending timers finish
		await new Promise((resolve) => setTimeout(resolve, 150))

		expect(readdirCallsAfterAbort).toBe(0)
	})
})
