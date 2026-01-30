import { test } from "node:test"
import { testScan } from "./0_testScan.test.js"
import { Git as target } from "./targets/git.js"

void test("depth 1 should include src/ and files", async () => {
	await testScan(
		{
			node_modules: {
				a: { "package.json": "{}" },
				b: { "package.json": "{}" },
			},
			out: {
				"index.js": "",
			},
			src: {
				"index.ts": "",
			},
			".gitignore": "out\nnode_modules",
			"package.json": "{}",
		},
		["src/", ".gitignore", "package.json"],
		{ target, depth: 0 },
	)
})

void test("depth 1 should include out/ and node_modules/ for inverted", async () => {
	await testScan(
		{
			node_modules: {
				a: { "package.json": "{}" },
				b: { "package.json": "{}" },
			},
			out: {
				"index.js": "",
			},
			src: {
				"index.ts": "",
			},
			".gitignore": "out\nnode_modules",
			"package.json": "{}",
		},
		["out/", "node_modules/"],
		{ target, invert: true, depth: 0 },
	)
})
