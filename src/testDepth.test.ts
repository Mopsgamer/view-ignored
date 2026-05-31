import { describe, test, expect } from "bun:test"

import { Git } from "./targets/git.js"
import { testScan } from "./testScan.test.js"

const dir = {
	".gitignore": "out\nnode_modules",
	node_modules: {
		a: { "package.json": "{}" },
		b: { "package.json": "{}" },
	},
	out: {
		"index.js": "",
		submodule: { "index.js": "" },
	},
	"package.json": "{}",
	src: {
		"index.ts": "",
		submodule: { "index.ts": "" },
	},
}

describe("Git", () => {
	test("depth 0 should include *", async (done) => {
		const target = { ...Git, internalRules: [...Git.internalRules] }
		await testScan(done, dir, ["src/", ".gitignore", "package.json"], {
			depth: 0,
			dirs: true,
			target,
		})
		await testScan(
			done,
			dir,
			(o) => {
				expect(o.ctx.paths.size).toBe(1)
			},
			{
				depth: 0,
				dirs: true,
				skipDepth: true,
				target,
			},
		)
	})

	test("depth 0 should include * for inverted", async (done) => {
		const target = { ...Git, internalRules: [...Git.internalRules] }
		await testScan(done, dir, ["out/", "node_modules/"], {
			depth: 0,
			dirs: true,
			invert: true,
			target,
		})
		await testScan(
			done,
			dir,
			(o) => {
				expect(o.ctx.paths.size).toBe(1)
			},
			{
				depth: 0,
				dirs: true,
				invert: true,
				skipDepth: true,
				target,
			},
		)
	})

	test("depth 1 should include */*", async (done) => {
		const target = { ...Git, internalRules: [...Git.internalRules] }
		await testScan(
			done,
			dir,
			["src/", "src/index.ts", "src/submodule/", ".gitignore", "package.json"],
			{ depth: 1, dirs: true, target },
		)
		await testScan(
			done,
			dir,
			(o) => {
				// root (depth 0) matches all. sub (depth 1) matches 1.
				// Root has 3 matched entries: src/, .gitignore, package.json
				// Inside src/ (depth 1), it matches 1 entry (either index.ts or submodule/)
				expect(o.ctx.paths.size).toBe(4)
			},
			{ depth: 1, dirs: true, skipDepth: true, target },
		)
	})

	test("depth 1 should include */* for inverted", async (done) => {
		const target = { ...Git, internalRules: [...Git.internalRules] }
		await testScan(
			done,
			dir,
			[
				"out/",
				"out/index.js",
				"out/submodule/",
				"node_modules/",
				"node_modules/a/",
				"node_modules/b/",
			],
			{ depth: 1, dirs: true, invert: true, target },
		)
		await testScan(
			done,
			dir,
			(o) => {
				// root: out/, node_modules/ (2)
				// in out/: 1 match
				// in node_modules/: 1 match
				// total 4
				expect(o.ctx.paths.size).toBe(4)
			},
			{ depth: 1, dirs: true, invert: true, skipDepth: true, target },
		)
	})
})
