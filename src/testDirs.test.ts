import type { FsAdapter, ScanOptions } from "./types.js"

import { describe, test, expect } from "bun:test"
import * as nodefs from "node:fs"
import * as process from "node:process"

import { matcherContextAddPath } from "./patterns/matcherContextPatch.js"
import { RuleMatchKind } from "./patterns/rule.js"
import { makeGit } from "./targets/git.js"
import { testScan } from "./testScan.test.js"
import { unixify } from "./unixify.js"

describe("dirs option", () => {
	test("dirs: false skips directories in results", async (done) => {
		await testScan(
			done,
			{
				"a.txt": "a",
				dir: {
					"b.txt": "b",
					subdir: {
						"c.txt": "c",
					},
				},
			},
			["a.txt", "dir/b.txt", "dir/subdir/c.txt"],
			{ dirs: false, target: makeGit() },
		)
	})

	test("dirs: true (default) includes directories in results", async (done) => {
		await testScan(
			done,
			{
				"a.txt": "a",
				dir: {
					"b.txt": "b",
				},
			},
			["a.txt", "dir/", "dir/b.txt"],
			{ target: makeGit() },
		)
	})

	test("dirs: false with skipDepth and skipInternal (fastOptions)", async (done) => {
		// .git should be ignored by default in makeGit()
		// node_modules is NOT ignored by default in makeGit() unless it's in .gitignore
		await testScan(
			done,
			{
				".git": {
					config: "config",
				},
				".gitignore": "ignored.txt",
				"a.txt": "a",
				"ignored.txt": "ignored",
			},
			["a.txt", ".gitignore"],
			{ dirs: false, skipDepth: true, skipInternal: true, target: makeGit() },
		)
	})

	test("dirs: false with skipDepth: true (fastDepth)", async (done) => {
		await testScan(
			done,
			{
				"a.txt": "a",
				dir: {
					"b.txt": "b",
					"c.txt": "c",
				},
			},
			["a.txt"],
			{ depth: 0, dirs: false, skipDepth: true, target: makeGit() },
		)
	})

	test("dirs: false with skipInternal: true (fastInternal)", async (done) => {
		await testScan(
			done,
			{
				".git": {
					config: "config",
				},
				"a.txt": "a",
			},
			["a.txt"],
			{ dirs: false, skipInternal: true, target: makeGit() },
		)
	})

	test("matcherContextAddPath honors dirs: false", async () => {
		const ctx = {
			external: new Map(),
			failed: [],
			paths: new Map(),
			total: new Map([[".", { totalDirs: 0, totalFiles: 0, totalMatchedFiles: 0 }]]),
		}
		const options: Required<ScanOptions> = {
			cwd: unixify(process.cwd()),
			depth: Infinity,
			dirs: false,
			fs: {
				readFile: ((
					_path: string,
					cb: (err: NodeJS.ErrnoException | null, data?: Buffer) => void,
				) => {
					const err = new Error("ENOENT") as NodeJS.ErrnoException
					err.code = "ENOENT"
					cb(err)
				}) as FsAdapter["readFile"],
				readdir: nodefs.readdir,
				stat: nodefs.stat,
			},
			invert: false,
			signal: null,
			skipDepth: false,
			skipInternal: false,
			target: {
				...makeGit(),
				ignores: (_opts, cb) => {
					//@ts-expect-error noMatch requires source, but we don't care
					cb(null, { ignored: false, kind: RuleMatchKind.noMatch })
				},
			},
			within: ".",
		}

		await matcherContextAddPath(ctx, options, "dir/")
		expect(ctx.paths.has("dir/")).toBe(false)

		// even with dirs: false, files should be added
		await matcherContextAddPath(ctx, options, "file.txt")
		expect(ctx.paths.has("file.txt")).toBe(true)

		// Set dirs: true to test it works normally
		const ctx2 = {
			external: new Map(),
			failed: [],
			paths: new Map(),
			total: new Map([[".", { totalDirs: 0, totalFiles: 0, totalMatchedFiles: 0 }]]),
		}
		const optionsTrue: Required<ScanOptions> = { ...options, dirs: true }
		await matcherContextAddPath(ctx2, optionsTrue, "dir2/")
		expect(ctx2.paths.has("dir2/")).toBe(true)
	})
})
