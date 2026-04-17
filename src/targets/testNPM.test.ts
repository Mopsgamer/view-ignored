import type { NestedDirectoryJSON } from "memfs"

import { describe, test, expect } from "bun:test"

import { testScan, type PathHandlerOptions } from "../testScan.test.js"
import { NPM as target } from "./npm.js"

function testNpm(
	done: () => void,
	tree: NestedDirectoryJSON,
	handler: ((o: PathHandlerOptions) => void | Promise<void>) | string[],
) {
	return testScan(done, tree, handler, { target })
}

const packageJsonNoFiles = JSON.stringify({
	name: "me",
	version: "0.0.1",
})

describe("NPM", () => {
	test("empty for empty", async (done) => {
		await testNpm(done, { ".": null, "package.json": packageJsonNoFiles }, ["package.json"])
	})

	test("includes for no sources", async (done) => {
		await testNpm(done, { file: "", "package.json": packageJsonNoFiles }, ["file", "package.json"])
	})

	test("keeps for empty source", async (done) => {
		await testNpm(
			done,
			{
				".npmignore": "",
				filekeep: "",
				"package.json": packageJsonNoFiles,
			},
			["filekeep", "package.json"],
		)
	})

	test("ignores file", async (done) => {
		await testNpm(
			done,
			{
				".npmignore": "file",
				file: "",
				"package.json": packageJsonNoFiles,
			},
			["package.json"],
		)
	})

	test("ignores multiple files", async (done) => {
		await testNpm(
			done,
			{
				".npmignore": "file1.txt\nfile2.txt",
				"file1.txt": "",
				"file2.txt": "",
				"package.json": packageJsonNoFiles,
			},
			["package.json"],
		)
	})

	test("ignores files with pattern", async (done) => {
		await testNpm(
			done,
			{
				".npmignore": "*.js",
				"bar.js": "",
				"foo.js": "",
				"package.json": packageJsonNoFiles,
			},
			["package.json"],
		)
	})

	test("ignores files in subdirectory", async (done) => {
		await testNpm(
			done,
			{
				".npmignore": "src/",
				"package.json": packageJsonNoFiles,
				src: {
					"helper.js": "",
					"main.js": "",
				},
			},
			["package.json"],
		)
	})

	test("does not ignore files not matching pattern", async (done) => {
		await testNpm(
			done,
			{
				".npmignore": "*.js",
				"bar.js": "",
				"foo.txt": "",
				"package.json": packageJsonNoFiles,
			},
			["foo.txt", "package.json"],
		)
	})

	test("negation pattern keeps file", async (done) => {
		await testNpm(
			done,
			{
				".npmignore": "*.js\n!bar.js",
				"bar.js": "",
				"foo.js": "",
				"package.json": packageJsonNoFiles,
			},
			["bar.js", "package.json"],
		)
	})

	test("collects errors", async (done) => {
		expect(
			testNpm(
				done,
				{
					"foo.js": "",
					"negkeep.js": "",
					"package.json": "{",
				},
				[],
			),
		).rejects.toThrowError("Expected")
	})
	test("monorepo should use package.json if cwd is .", async (done) => {
		await testScan(
			done,
			{
				file: "1",
				"index.js": "('src')",
				"index.ts": "('src')",
				"package.json": JSON.stringify({
					files: ["index.ts"],
					name: "root",
					version: "0.0.1",
				}),
				packages: {
					a: {
						"index.js": "('a')",
						"package.json": JSON.stringify({
							files: ["index.js"],
							name: "a",
							version: "0.0.1",
						}),
					},
				},
			},
			({ ctx }) => {
				expect(ctx.paths.has("file")).toBeFalse()
				expect(ctx.paths.get("index.ts")).toMatchObject({
					ignored: false,
					kind: "external",
					pattern: "index.ts",
				})
				expect(ctx.paths.has("index.js")).toBeFalse()
				expect(ctx.paths.has("packages/a/index.js")).toBeFalse()

				const src = ctx.external.get("packages/a") as any
				expect(src).toBeObject()
				expect(src?.path).toBe("package.json")
			},
			{ cwd: process.cwd() + "/test", target },
		)
	})
	test("monorepo should use packages/a/package.json if cwd is packages/a", async (done) => {
		await testScan(
			done,
			{
				file: "1",
				"index.js": "('src')",
				"index.ts": "('src')",
				"package.json": JSON.stringify({
					files: ["index.ts"],
					name: "root",
					version: "0.0.1",
				}),
				packages: {
					a: {
						"index.js": "('a')",
						"package.json": JSON.stringify({
							files: ["index.js"],
							name: "a",
							version: "0.0.1",
						}),
					},
				},
			},
			({ ctx }) => {
				expect(ctx.paths.has("file")).toBeFalse()
				expect(ctx.paths.has("index.ts")).toBeFalse()
				expect(ctx.paths.has("index.js")).toBeTrue()
				expect(ctx.paths.has("packages/a/index.js")).toBeFalse()

				expect(ctx.paths.get("packages/a/")).toBeUndefined()

				expect(ctx.external.get("packages/a")).toBeUndefined()
				const src = ctx.external.get(".") as any
				expect(src).toBeObject()
				expect(src?.path).toBe("package.json")
			},
			{ cwd: process.cwd() + "/test/packages/a", target },
		)
	})
})
