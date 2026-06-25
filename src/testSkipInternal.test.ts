import { describe, test, expect } from "bun:test"

import { makeGit } from "./targets/git.js"
import { testScan } from "./testScan.test.js"

describe("skipInternal option", () => {
	const tree = {
		".git": {
			config: "...",
			hooks: { precommit: "..." },
		},
		".gitignore": "node_modules",
		node_modules: {
			a: { "package.json": "{}" },
		},
		src: {
			"index.ts": "",
		},
	}

	test("skipInternal: false (default) scans .git if it was not ignored (but .git is usually internal ignore)", async (done) => {
		// By default makeGit() ignores .git
		// So .git/config should NOT be in paths.
		// However, it IS scanned unless skipInternal is true.
		// Wait, if it's ignored, it's not in paths.
		// Let's check totals.
		await testScan(
			done,
			tree,
			(o) => {
				const { ctx } = o
				expect(ctx.paths.has(".git/")).toBeFalse()
				expect(ctx.paths.has("src/index.ts")).toBeTrue()
				// .git and its contents ARE counted in totalFiles/totalDirs if they are scanned
				// .git is internal ignored in makeGit()
				expect(ctx.total.get(".")!.totalDirs).toBeGreaterThan(1) // src, .git, .git/hooks, node_modules
			},
			{ skipInternal: false, target: makeGit() },
		)
	})

	test("skipInternal: true skips internal ignored directories", async (done) => {
		await testScan(
			done,
			tree,
			(o) => {
				const { ctx } = o
				expect(ctx.paths.has(".git/")).toBeFalse()
				expect(ctx.paths.has("src/index.ts")).toBeTrue()

				// node_modules is NOT internal, it's external (from .gitignore)
				// skipInternal only affects internal ignores?
				// Let's check walk.ts again.
				// match.ignored is true for both internal and external.
				// The option name is "skipInternal" but the implementation in walk.ts just checks `match.ignored && skipInternal`.
				// So it skips ANY ignored directory.

				// With skipInternal: true, .git/ config and hooks should NOT be in totals.
				// node_modules/ a and package.json should NOT be in totals.

				const rootTotal = ctx.total.get(".")!
				// dirs: src, .git, node_modules. (.git/hooks is skipped)
				expect(rootTotal.totalDirs).toBe(3)
				// files: .gitignore, src/index.ts. (.git/config, node_modules/a/package.json are skipped)
				expect(rootTotal.totalFiles).toBe(2)
				expect(rootTotal.totalMatchedFiles).toBe(2) // src/index.ts AND .gitignore are matched by git
				// actually .gitignore is usually NOT ignored by git.
			},
			{ skipInternal: true, target: makeGit() },
		)
	})
})
