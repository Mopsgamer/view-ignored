import { describe, test } from "bun:test"
import { testScan } from "./testScan.test.js"
import { Git as target } from "./targets/git.js"

const dir = {
	node_modules: {
		a: { "package.json": "{}" },
		b: { "package.json": "{}" },
	},
	out: {
		submodule: { "index.js": "" },
		"index.js": "",
	},
	src: {
		submodule: { "index.ts": "" },
		"index.ts": "",
	},
	".gitignore": "out\nnode_modules",
	"package.json": "{}",
}

describe("Git", () => {
	test("depth 0 should include *", async (done) => {
		await testScan(done, dir, ["src/", ".gitignore", "package.json"], { target, depth: 0 })
	})

	test("depth 0 should include * for inverted", async (done) => {
		await testScan(done, dir, ["out/", "node_modules/"], { target, invert: true, depth: 0 })
	})

	test("depth 1 should include */*", async (done) => {
		await testScan(
			done,
			dir,
			["src/", "src/index.ts", "src/submodule/", ".gitignore", "package.json"],
			{ target, depth: 1 },
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
			{ target, invert: true, depth: 1 },
		)
	})
})
