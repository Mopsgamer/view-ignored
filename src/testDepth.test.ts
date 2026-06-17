import { describe, test } from "bun:test"

import { makeGit } from "./targets/git.js"
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

const skipDepth = true

describe("Git", () => {
	test("depth 0 should include *", async (done) => {
		await testScan(done, dir, ["src/", ".gitignore", "package.json"], {
			depth: 0,
			target: makeGit(),
		})
		await testScan(done, dir, ["src/", ".gitignore", "package.json"], {
			depth: 0,
			skipDepth,
			target: makeGit(),
		})
	})

	test("depth 0 should include * for inverted", async (done) => {
		await testScan(done, dir, ["out/", "node_modules/"], {
			depth: 0,
			invert: true,
			target: makeGit(),
		})
		await testScan(done, dir, ["out/", "node_modules/"], {
			depth: 0,
			invert: true,
			skipDepth,
			target: makeGit(),
		})
	})

	test("depth 1 should include */*", async (done) => {
		await testScan(
			done,
			dir,
			["src/", "src/index.ts", "src/submodule/", ".gitignore", "package.json"],
			{ depth: 1, target: makeGit() },
		)
		await testScan(
			done,
			dir,
			["src/", "src/index.ts", "src/submodule/", ".gitignore", "package.json"],
			{ depth: 1, skipDepth, target: makeGit() },
		)
	})

	test("depth 1 should include */* for inverted", async (done) => {
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
			{ depth: 1, invert: true, target: makeGit() },
		)
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
			{ depth: 1, invert: true, skipDepth, target: makeGit() },
		)
	})
})
