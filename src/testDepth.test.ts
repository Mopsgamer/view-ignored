import { describe, test } from "bun:test"

import { Git } from "./targets/git.js"
import { testScan } from "./testScan.test.js"
import { ScanFlags } from "./types.js"

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
		await testScan(done, dir, ["src/", ".gitignore", "package.json"], { depth: 0, target })
		await testScan(done, dir, ["src/", ".gitignore", "package.json"], {
			depth: 0,
			flags: ScanFlags.fastDepth,
			target,
		})
	})

	test("depth 0 should include * for inverted", async (done) => {
		const target = { ...Git, internalRules: [...Git.internalRules] }
		await testScan(done, dir, ["out/", "node_modules/"], {
			depth: 0,
			flags: ScanFlags.invert,
			target,
		})
		await testScan(done, dir, ["out/", "node_modules/"], {
			depth: 0,
			flags: ScanFlags.fastDepth | ScanFlags.invert,
			target,
		})
	})

	test("depth 1 should include */*", async (done) => {
		const target = { ...Git, internalRules: [...Git.internalRules] }
		await testScan(
			done,
			dir,
			["src/", "src/index.ts", "src/submodule/", ".gitignore", "package.json"],
			{ depth: 1, target },
		)
		await testScan(
			done,
			dir,
			["src/", "src/index.ts", "src/submodule/", ".gitignore", "package.json"],
			{ depth: 1, flags: ScanFlags.fastDepth, target },
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
			{ depth: 1, flags: ScanFlags.invert, target },
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
			{ depth: 1, flags: ScanFlags.fastDepth | ScanFlags.invert, target },
		)
	})
})
