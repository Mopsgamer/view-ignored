import { describe, test, expect } from "bun:test"

import { scan } from "./scan.js"
import { makeGit } from "./targets/git.js"
import { testScan } from "./testScan.test.js"

describe("within option with file path", () => {
	test("root file path with within", async (done) => {
		await testScan(
			done,
			{
				"file1.txt": "hello",
				"file2.txt": "world",
			},
			["file1.txt"],
			{ target: makeGit(), within: "file1.txt" },
		)
	})

	test("root file path with leading ./ in within", async (done) => {
		await testScan(
			done,
			{
				"file1.txt": "hello",
				"file2.txt": "world",
			},
			["file1.txt"],
			{ target: makeGit(), within: "./file1.txt" },
		)
	})

	test("nested file path with within (dirs: true)", async (done) => {
		await testScan(
			done,
			{
				subdir: {
					"a.txt": "a",
					"b.txt": "b",
				},
			},
			["subdir/", "subdir/a.txt"],
			{ dirs: true, target: makeGit(), within: "subdir/a.txt" },
		)
	})

	test("nested file path with within (dirs: false)", async (done) => {
		await testScan(
			done,
			{
				subdir: {
					"a.txt": "a",
					"b.txt": "b",
				},
			},
			["subdir/a.txt"],
			{ dirs: false, target: makeGit(), within: "subdir/a.txt" },
		)
	})

	test("ignored file path with within", async (done) => {
		await testScan(
			done,
			{
				".gitignore": "*.log",
				subdir: {
					"app.log": "log",
					"main.js": "js",
				},
			},
			[],
			{ target: makeGit(), within: "subdir/app.log" },
		)
	})

	test("ignored file path with within and invert: true", async (done) => {
		await testScan(
			done,
			{
				".gitignore": "*.log",
				subdir: {
					"app.log": "log",
					"main.js": "js",
				},
			},
			["subdir/", "subdir/app.log"],
			{ invert: true, target: makeGit(), within: "subdir/app.log" },
		)
	})

	test("respects .git/info/exclude when scanning file within", async (done) => {
		await testScan(
			done,
			{
				".git": {
					info: {
						exclude: "ignored.txt",
					},
				},
				subdir: {
					"ignored.txt": "ignored",
					"kept.txt": "kept",
				},
			},
			["subdir/", "subdir/kept.txt"],
			{ target: makeGit(), within: "subdir/kept.txt" },
		)
	})

	test("array of file paths in within", async (done) => {
		await testScan(
			done,
			{
				"file1.txt": "1",
				"file2.txt": "2",
				"file3.txt": "3",
			},
			["file1.txt", "file3.txt"],
			{ target: makeGit(), within: ["file1.txt", "file3.txt"] },
		)
	})

	test("array of mixed files and directories in within", async (done) => {
		await testScan(
			done,
			{
				dir1: {
					"a.txt": "a",
				},
				dir2: {
					"b.txt": "b",
				},
				"root.txt": "root",
			},
			["dir1/", "dir1/a.txt", "root.txt"],
			{ target: makeGit(), within: ["dir1", "root.txt"] },
		)
	})

	test("non-existent file with within throws ENOENT", async () => {
		let thrownErr: Error | null = null
		try {
			await scan({
				cwd: process.cwd(),
				target: makeGit(),
				within: "nonexistent_file_xyz_123.txt",
			})
		} catch (err) {
			thrownErr = err as Error
		}
		expect(thrownErr).not.toBeNull()
		// oxlint-disable-next-line typescript/no-explicit-any
		expect((thrownErr as any).code).toBe("ENOENT")
	})
})
