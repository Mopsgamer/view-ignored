import { describe, test, expect } from "bun:test"

import { testScan } from "../testScan.test.js"
import { makeNPM } from "./npm.js"

describe("NPM target with within option", () => {
	const testTree = {
		"package.json": JSON.stringify({
			bundleDependencies: ["history"],
			dependencies: {
				history: "1.0.0",
			},
			name: "root",
			version: "1.0.0",
		}),
		sub: {
			"file.js": "",
			node_modules: {
				history: {
					"index.js": "console.log('history')",
					nested: {
						"nested.js": "console.log('nested')",
					},
					"package.json": JSON.stringify({
						main: "index.js",
						name: "history",
						version: "1.0.0",
					}),
				},
			},
		},
	}

	test("bundled dependencies are correctly resolved when using within option", async (done) => {
		await testScan(
			done,
			testTree,
			({ ctx }) => {
				expect(ctx.paths.has("sub/node_modules/history/index.js")).toBeTrue()
				expect(ctx.paths.has("sub/node_modules/history/package.json")).toBeTrue()
				expect(ctx.paths.has("sub/node_modules/history/nested/nested.js")).toBeTrue()
				expect(ctx.paths.has("sub/file.js")).toBeTrue()
			},
			{
				target: makeNPM(),
				within: "sub",
			},
		)
	})

	test("bundled dependencies are clipped/excluded correctly based on depth: 1", async (done) => {
		await testScan(
			done,
			testTree,
			({ ctx }) => {
				expect(ctx.paths.has("sub/file.js")).toBeTrue()
				// sub/node_modules/history/index.js has depth 2 relative to sub, so it must be excluded when depth is 1
				expect(ctx.paths.has("sub/node_modules/history/index.js")).toBeFalse()
				expect(ctx.paths.has("sub/node_modules/history/package.json")).toBeFalse()
				expect(ctx.paths.has("sub/node_modules/history/nested/nested.js")).toBeFalse()
			},
			{
				depth: 1,
				target: makeNPM(),
				within: "sub",
			},
		)
	})

	test("bundled dependencies are clipped/excluded correctly based on depth: 0", async (done) => {
		await testScan(
			done,
			testTree,
			({ ctx }) => {
				expect(ctx.paths.has("sub/file.js")).toBeTrue()
				// sub/node_modules/history has depth 1 relative to sub, so it must be excluded when depth is 0
				expect(ctx.paths.has("sub/node_modules/history/index.js")).toBeFalse()
				expect(ctx.paths.has("sub/node_modules/history/package.json")).toBeFalse()
				expect(ctx.paths.has("sub/node_modules/history/nested/nested.js")).toBeFalse()
			},
			{
				depth: 0,
				target: makeNPM(),
				within: "sub",
			},
		)
	})

	test("bundled dependencies are clipped/excluded correctly based on depth: 2", async (done) => {
		await testScan(
			done,
			testTree,
			({ ctx }) => {
				expect(ctx.paths.has("sub/file.js")).toBeTrue()
				// depth 2 relative to sub: includes sub/node_modules/history/index.js (depth 2)
				expect(ctx.paths.has("sub/node_modules/history/index.js")).toBeTrue()
				expect(ctx.paths.has("sub/node_modules/history/package.json")).toBeTrue()
				// sub/node_modules/history/nested/nested.js has depth 3, so it must be excluded when depth is 2
				expect(ctx.paths.has("sub/node_modules/history/nested/nested.js")).toBeFalse()
			},
			{
				depth: 2,
				target: makeNPM(),
				within: "sub",
			},
		)
	})
})
