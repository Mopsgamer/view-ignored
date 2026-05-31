import { describe, expect, test } from "bun:test"
import { Volume } from "memfs"

import { scan, type ScanOptions } from "./browser_scan.js"
import { matcherContextAddPath, matcherContextRemovePath } from "./patterns/matcherContextPatch.js"
import { Git } from "./targets/git.js"
import { testScan, createAdapter } from "./testScan.test.js"
import { sortFirstFolders } from "./testSort.test.js"

const dir = {
	d1: {
		"f3.txt": "",
		"f4.txt": "",
	},
	d2: {
		sd1: {
			"f5.txt": "",
		},
		sd2: {}, // empty sub-subdir
	},
	d3: {
		sd3: {
			"f6.txt": "",
		},
	},
	d4: {
		sd4: {}, // directory with only empty subdirectories
	},
	"f1.txt": "",
	"f2.txt": "",
}

describe("skipDepth", () => {
	test("depth 0, skipDepth true: paths complete for root, totals reduced for subdirs, no empty dirs", async (done) => {
		const expectedPaths = sortFirstFolders(["f1.txt", "f2.txt", "d1/", "d2/", "d3/"])
		await testScan(
			done,
			dir,
			({ ctx }) => {
				expect(sortFirstFolders(ctx.paths.keys())).toStrictEqual(expectedPaths)

				// d1 (depth 1 > 0): skipDepth stops after f3.txt
				expect(ctx.total.get("d1")).toStrictEqual({
					totalDirs: 0,
					totalFiles: 1,
					totalMatchedFiles: 1,
				})

				// d2 (depth 1 > 0): skipDepth stops after sd1
				expect(ctx.total.get("d2")).toStrictEqual({
					totalDirs: 1, // sd1
					totalFiles: 1,
					totalMatchedFiles: 1,
				})

				// d4 is empty, should not be in paths or total
				expect(ctx.total.has("d4")).toBeFalse()
				expect(ctx.paths.has("d4/")).toBeFalse()

				// root (depth 0): (5, 5, 5)
				expect(ctx.total.get(".")).toStrictEqual({
					totalDirs: 5,
					totalFiles: 5,
					totalMatchedFiles: 5,
				})
			},
			{
				depth: 0,
				dirs: true,
				skipDepth: true,
				target: Git,
			},
		)
	})

	test("depth 1, skipDepth true: paths complete for root and sub, totals reduced for sub-subdirs", async (done) => {
		const expectedPaths = sortFirstFolders([
			"f1.txt",
			"f2.txt",
			"d1/",
			"d2/",
			"d3/",
			"d1/f3.txt",
			"d1/f4.txt",
			"d2/sd1/",
			"d3/sd3/",
		])
		await testScan(
			done,
			dir,
			({ ctx }) => {
				expect(sortFirstFolders(ctx.paths.keys())).toStrictEqual(expectedPaths)

				// d1 (depth 0 < 1) -> full scan (2, 2, 0)
				// d2 (depth 0 < 1) -> full scan. d2/sd1 (depth 2 > 1) -> stops after f5 (1, 1, 0)
				expect(ctx.total.get("d2")).toStrictEqual({
					totalDirs: 1, // only sd1
					totalFiles: 1,
					totalMatchedFiles: 1,
				})

				// d4 is empty -> no entry
				expect(ctx.total.has("d4")).toBeFalse()

				// root (depth 0 < 1) -> full scan
				// totalFiles: 2 (root) + 2 (d1) + 1 (d2:sd1) + 1 (d3:sd3) = 6
				// totalDirs: 3 (root: d1, d2, d3) + 0 (d1) + 1 (d2:sd1) + 1 (d3:sd3) = 5
				expect(ctx.total.get(".")).toStrictEqual({
					totalDirs: 5,
					totalFiles: 6,
					totalMatchedFiles: 6,
				})
			},
			{
				depth: 1,
				dirs: true,
				skipDepth: true,
				target: Git,
			},
		)
	})

	const dopts: Required<ScanOptions> = {
		cwd: "/test",
		depth: Infinity,
		dirs: true,
		fs: null as any,
		invert: false,
		signal: null,
		skipDepth: true,
		skipInternal: false,
		target: Git,
		within: ".",
	}

	test("matcherContextAddPath handles skipDepth at depth 0", async () => {
		const vol = Volume.fromNestedJSON(dir, "/test")
		const fs = createAdapter(vol)
		const opts = { ...dopts, depth: 0, fs }

		const ctx = await scan(opts)
		vol.mkdirSync("/test/d5")
		vol.writeFileSync("/test/d5/f7.txt", "")
		await matcherContextAddPath(ctx, opts, "d5/f7.txt")

		expect(ctx.total.get("d5")).toStrictEqual({ totalDirs: 0, totalFiles: 1, totalMatchedFiles: 1 })
		expect(ctx.total.get(".")).toStrictEqual({ totalDirs: 6, totalFiles: 6, totalMatchedFiles: 6 })
	})

	test("matcherContextAddPath handles skipDepth at depth 1 (adding at depth 1)", async () => {
		const vol = Volume.fromNestedJSON(dir, "/test")
		const fs = createAdapter(vol)
		const opts = { ...dopts, depth: 1, fs }

		const ctx = await scan(opts)
		vol.mkdirSync("/test/d5")
		vol.writeFileSync("/test/d5/f7.txt", "")
		await matcherContextAddPath(ctx, opts, "d5/f7.txt")

		expect(ctx.total.get("d5")).toStrictEqual({ totalDirs: 0, totalFiles: 1, totalMatchedFiles: 1 })
		expect(ctx.total.get(".")).toStrictEqual({ totalDirs: 6, totalFiles: 7, totalMatchedFiles: 7 })
	})

	test("matcherContextAddPath handles skipDepth at depth 1 (adding at depth 2)", async () => {
		const vol = Volume.fromNestedJSON(dir, "/test")
		const fs = createAdapter(vol)
		const opts = { ...dopts, depth: 1, fs }

		const ctx = await scan(opts)

		// Add d1/sd4/f8.txt (depth 2)
		vol.mkdirSync("/test/d1/sd4")
		vol.writeFileSync("/test/d1/sd4/f8.txt", "")

		await matcherContextAddPath(ctx, opts, "d1/sd4/f8.txt")

		// d1/sd4 scan should stop after f8.txt
		expect(ctx.total.get("d1/sd4")).toStrictEqual({
			totalDirs: 0,
			totalFiles: 1,
			totalMatchedFiles: 1,
		})

		// d1 total: was (2, 2, 0). now + (1 file, 1 matched, 1 dir:sd4) = (3, 3, 1)
		expect(ctx.total.get("d1")).toStrictEqual({
			totalDirs: 1,
			totalFiles: 3,
			totalMatchedFiles: 3,
		})

		// root total: was (6, 6, 5). now + (1 file, 1 matched, 0 dir) = (7, 7, 5)
		expect(ctx.total.get(".")).toStrictEqual({
			totalDirs: 5,
			totalFiles: 7,
			totalMatchedFiles: 7,
		})
	})

	test("matcherContextRemovePath handles skipDepth at depth 0", async () => {
		const vol = Volume.fromNestedJSON(dir, "/test")
		const fs = createAdapter(vol)
		const opts = { ...dopts, depth: 0, fs }

		const ctx = await scan(opts)
		await matcherContextRemovePath(ctx, opts, "d1/f3.txt")
		expect(ctx.total.get(".")).toStrictEqual({ totalDirs: 5, totalFiles: 4, totalMatchedFiles: 4 })
	})

	test("matcherContextRemovePath handles skipDepth at depth 1", async () => {
		const vol = Volume.fromNestedJSON(dir, "/test")
		const fs = createAdapter(vol)
		const opts = { ...dopts, depth: 1, fs }

		const ctx = await scan(opts)

		// Remove f3.txt from d1 (2, 2, 0) -> (1, 1, 0)
		await matcherContextRemovePath(ctx, opts, "d1/f3.txt")

		expect(ctx.total.get("d1")).toStrictEqual({
			totalDirs: 0,
			totalFiles: 1,
			totalMatchedFiles: 1,
		})

		// root (6, 6, 5) -> (5, 5, 5)
		expect(ctx.total.get(".")).toStrictEqual({
			totalDirs: 5,
			totalFiles: 5,
			totalMatchedFiles: 5,
		})
	})
})
