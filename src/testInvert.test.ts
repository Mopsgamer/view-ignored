import { describe, test, expect } from "bun:test"

import { makeGit } from "./targets/git.js"
import { testScan, testStream } from "./testScan.test.js"

const dir = {
	".gitignore": "ignored.txt",
	"ignored.txt": "content",
	"included.txt": "content",
}

describe("Invert logic", () => {
	test("invert: false (default) should return only included files with ignored: false", async (done) => {
		await testScan(
			done,
			dir,
			(o) => {
				const { ctx } = o
				expect(Array.from(ctx.paths.keys()).sort()).toEqual([".gitignore", "included.txt"].sort())
				expect(ctx.paths.get("included.txt")?.ignored).toBe(false)
				expect(ctx.paths.get(".gitignore")?.ignored).toBe(false)
			},
			{
				target: makeGit(),
			},
		)
	})

	test("invert: true should return only ignored files with ignored: true", async (done) => {
		await testScan(
			done,
			dir,
			(o) => {
				const { ctx } = o
				expect(Array.from(ctx.paths.keys())).toEqual(["ignored.txt"])
				expect(ctx.paths.get("ignored.txt")?.ignored).toBe(true)
			},
			{ invert: true, target: makeGit() },
		)
	})

	test("invert: 2 should return both included and ignored files with correct ignored status", async (done) => {
		await testScan(
			done,
			dir,
			(o) => {
				const { ctx } = o
				expect(Array.from(ctx.paths.keys()).sort()).toEqual(
					[".gitignore", "included.txt", "ignored.txt"].sort(),
				)
				expect(ctx.paths.get("included.txt")?.ignored).toBe(false)
				expect(ctx.paths.get("ignored.txt")?.ignored).toBe(true)
				expect(ctx.paths.get(".gitignore")?.ignored).toBe(false)
			},
			{ invert: 2, target: makeGit() },
		)
	})
})

describe("Invert logic (Stream events)", () => {
	test("invert: false (default) - should emit dirent events only for included files", async () => {
		await testStream(
			dir,
			({ stream }) => {
				const emittedPaths: string[] = []

				stream.addEventListener("dirent", ({ detail: dirent }) => {
					emittedPaths.push(dirent.path)
					expect(dirent.match.ignored).toBe(false)
				})

				stream.addEventListener("end", () => {
					expect(emittedPaths.sort()).toEqual([".gitignore", "included.txt"].sort())
				})
			},
			{ target: makeGit() },
		)
	})

	test("invert: true - should emit dirent events only for ignored files", async () => {
		await testStream(
			dir,
			({ stream }) => {
				const emittedPaths: string[] = []

				stream.addEventListener("dirent", ({ detail: dirent }) => {
					emittedPaths.push(dirent.path)
					expect(dirent.match.ignored).toBe(true)
				})

				stream.addEventListener("end", () => {
					expect(emittedPaths).toEqual(["ignored.txt"])
				})
			},
			{ invert: true, target: makeGit() },
		)
	})

	test("invert: 2 - should emit dirent events for all files with correct flags", async () => {
		await testStream(
			dir,
			({ stream }) => {
				const emitted: Record<string, boolean> = {}

				stream.addEventListener("dirent", ({ detail: dirent }) => {
					emitted[dirent.path] = dirent.match.ignored
				})

				stream.addEventListener("end", () => {
					expect(Object.keys(emitted).sort()).toEqual(
						[".gitignore", "included.txt", "ignored.txt"].sort(),
					)
					expect(emitted["included.txt"]).toBe(false)
					expect(emitted["ignored.txt"]).toBe(true)
					expect(emitted[".gitignore"]).toBe(false)
				})
			},
			{ invert: 2, target: makeGit() },
		)
	})
})
