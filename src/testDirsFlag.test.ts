import { describe, expect, it } from "bun:test"

import { matcherContextAddPath, matcherContextRemovePath } from "./patterns/matcherContextPatch.js"
import { Git } from "./targets/git.js"
import { testScan } from "./testScan.test.js"

describe("ScanOptions.dirs", () => {
	it("should NOT include directories by default", async () => {
		await testScan(
			() => {},
			{
				"a.txt": "a",
				dir: {
					"b.txt": "b",
				},
			},
			async ({ ctx }) => {
				expect(ctx.paths.has("a.txt")).toBeTrue()
				expect(ctx.paths.has("dir/")).toBeFalse()
				expect(ctx.paths.has("dir/b.txt")).toBeTrue()
			},
			{ target: Git },
		)
	})

	it("should include directories when ScanOptions.dirs is set", async () => {
		await testScan(
			() => {},
			{
				"a.txt": "a",
				dir: {
					"b.txt": "b",
				},
			},
			async ({ ctx }) => {
				expect(ctx.paths.has("a.txt")).toBeTrue()
				expect(ctx.paths.has("dir/")).toBeTrue()
				expect(ctx.paths.has("dir/b.txt")).toBeTrue()
			},
			{ dirs: true, target: Git },
		)
	})

	it("patchers should respect ScanOptions.dirs", async () => {
		await testScan(
			() => {},
			{
				"a.txt": "a",
			},
			async ({ ctx, options }) => {
				const opt = { ...options } as any

				// Add dir without flag
				await matcherContextAddPath(ctx, opt, "newdir/")
				expect(ctx.paths.has("newdir/")).toBeFalse()

				// Add dir with flag
				const optWithDirs = { ...opt, dirs: true }
				await matcherContextAddPath(ctx, optWithDirs, "otherdir/")
				expect(ctx.paths.has("otherdir/")).toBeTrue()

				// Remove dir
				await matcherContextRemovePath(ctx, optWithDirs, "otherdir/")
				expect(ctx.paths.has("otherdir/")).toBeFalse()
			},
			{ target: Git },
		)
	})
})
