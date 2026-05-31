import { describe, test, expect } from "bun:test"

import { Git } from "./targets/git.js"
import { testScan } from "./testScan.test.js"

const dir = {
	"a.txt": "a",
	"b.txt": "b",
	"c.txt": "c",
	sub: {
		"d.txt": "d",
		"e.txt": "e",
	},
}

describe("skipDepth", () => {
	test("depth 0: should only match one file in root", async (done) => {
		const target = { ...Git, internalRules: [...Git.internalRules] }
		await testScan(
			done,
			dir,
			async ({ ctx }) => {
				const rootTotal = ctx.total.get(".")
				expect(rootTotal?.totalMatchedFiles).toBe(1)
				// It should also have only 1 entry in paths (excluding directories if dirs: false)
				expect(ctx.paths.size).toBe(1)
			},
			{
				depth: 0,
				skipDepth: true,
				target,
			},
		)
	})

	test("depth 1: should match all in root, but only one in sub", async (done) => {
		const target = { ...Git, internalRules: [...Git.internalRules] }
		await testScan(
			done,
			dir,
			async ({ ctx }) => {
				const rootTotal = ctx.total.get(".")
				const subTotal = ctx.total.get("sub")

				expect(subTotal?.totalMatchedFiles).toBe(1)
				expect(rootTotal?.totalMatchedFiles).toBe(4)
			},
			{
				depth: 1,
				skipDepth: true,
				target,
			},
		)
	})

	test("depth 0, dirs: true: should match either a file or a directory and skip others", async (done) => {
		const target = { ...Git, internalRules: [...Git.internalRules] }
		await testScan(
			done,
			dir,
			async ({ ctx }) => {
				const rootTotal = ctx.total.get(".")
				// Since sub/ is a directory and dirs: true, sub/ is a match.
				// If it matches sub/ first, it might skip files.
				expect(
					rootTotal?.totalMatchedFiles + (ctx.paths.has("sub/") ? 1 : 0),
				).toBeGreaterThanOrEqual(1)
				expect(ctx.paths.size).toBe(1)
			},
			{
				depth: 0,
				dirs: true,
				skipDepth: true,
				target,
			},
		)
	})
})
