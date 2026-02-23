import type { NestedDirectoryJSON } from "memfs"

import { describe, test, expect } from "bun:test"

import type { Source } from "../patterns/source.js"

import { testScan, type PathHandlerOptions } from "../testScan.test.js"
import { Yarn as target } from "./yarn.js"

function testYarn(
	done: () => void,
	tree: NestedDirectoryJSON,
	handler: ((o: PathHandlerOptions) => void | Promise<void>) | string[],
) {
	return testScan(done, tree, handler, { target })
}

describe("Yarn", () => {
	test("empty for empty", async (done) => {
		await testYarn(done, { ".": null }, [])
	})

	test("includes for no sources", async (done) => {
		await testYarn(done, { file: "" }, ["file"])
	})

	test("keeps for empty source", async (done) => {
		await testYarn(
			done,
			{
				filekeep: "",
				".npmignore": "",
			},
			["filekeep"],
		)
	})

	test("ignores file", async (done) => {
		await testYarn(
			done,
			{
				file: "",
				".npmignore": "file",
			},
			[],
		)
	})

	test("ignores file nocase", async (done) => {
		await testYarn(
			done,
			{
				file: "",
				".npmignore": "File",
			},
			[],
		)
	})

	test("ignores multiple files", async (done) => {
		await testYarn(
			done,
			{
				"file1.txt": "",
				"file2.txt": "",
				".npmignore": "file1.txt\nfile2.txt",
			},
			[],
		)
	})

	test("ignores files with pattern", async (done) => {
		await testYarn(
			done,
			{
				"foo.js": "",
				"bar.js": "",
				".npmignore": "*.js",
			},
			[],
		)
	})

	test("ignores files in subdirectory", async (done) => {
		await testYarn(
			done,
			{
				src: {
					"main.js": "",
					"helper.js": "",
				},
				".npmignore": "src/",
			},
			[],
		)
	})

	test("does not ignore files not matching pattern", async (done) => {
		await testYarn(
			done,
			{
				"foo.txt": "",
				"bar.js": "",
				".npmignore": "*.js",
			},
			["foo.txt"],
		)
	})

	test("negation pattern keeps file", async (done) => {
		await testYarn(
			done,
			{
				"foo.js": "",
				"bar.js": "",
				".npmignore": "*.js\n!bar.js",
			},
			["bar.js"],
		)
	})

	test("collects errors", async (done) => {
		expect(
			testYarn(
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
				packages: {
					a: {
						"index.js": "('a')",
						"package.json": JSON.stringify({
							name: "a",
							version: "0.0.1",
							files: ["index.js"],
						}),
					},
				},
				file: "1",
				"index.js": "('src')",
				"index.ts": "('src')",
				"package.json": JSON.stringify({
					name: "root",
					version: "0.0.1",
					files: ["index.ts"],
				}),
			},
			({ ctx }) => {
				expect(ctx.paths.has("file")).toBeFalse()
				expect(ctx.paths.get("index.ts")).toMatchObject({
					ignored: false,
					pattern: "index.ts",
					kind: "external",
				})
				expect(ctx.paths.has("index.js")).toBeFalse()
				expect(ctx.paths.has("packages/a/index.js")).toBeFalse()

				let source = ctx.external.get("packages/a")
				expect(source).toBeObject()
				source = source as Source
				expect(source.path).toBe("package.json")
			},
			{ target, cwd: process.cwd() + "/test" },
		)
	})
	test("monorepo should use packages/a/package.json if cwd is packages/a", async (done) => {
		await testScan(
			done,
			{
				packages: {
					a: {
						"index.js": "('a')",
						"package.json": JSON.stringify({
							name: "a",
							version: "0.0.1",
							files: ["index.js"],
						}),
					},
				},
				file: "1",
				"index.js": "('src')",
				"index.ts": "('src')",
				"package.json": JSON.stringify({
					name: "root",
					version: "0.0.1",
					files: ["index.ts"],
				}),
			},
			({ ctx }) => {
				expect(ctx.paths.has("file")).toBeFalse()
				expect(ctx.paths.has("index.ts")).toBeFalse()
				expect(ctx.paths.has("index.js")).toBeTrue()
				expect(ctx.paths.has("packages/a/index.js")).toBeFalse()

				expect(ctx.paths.get("packages/a/")).toBeUndefined()

				expect(ctx.external.get("packages/a")).toBeUndefined()
				expect((ctx.external.get(".") as Source)?.path).toBe("package.json")
			},
			{ target, cwd: process.cwd() + "/test/packages/a" },
		)
	})

	test("bin included using manifest", async (done) => {
		await testYarn(
			done,
			{
				bin: {
					app: "yarn bin test file content",
				},
				"index.js": "",
				"package.json": JSON.stringify({
					bin: "./bin/app",
					files: ["index.js"],
				}),
			},
			["index.js", "package.json", "bin/", "bin/app"],
		)
	})
	test("bin included using manifest", async (done) => {
		await testYarn(
			done,
			{
				bin: {
					app: "yarn bin test file content",
				},
				"index.js": "",
				"package.json": JSON.stringify({
					bin: "bin/app",
					files: ["index.js"],
				}),
			},
			["index.js", "package.json", "bin/", "bin/app"],
		)
	})
	test("bin object included using manifest", async (done) => {
		await testYarn(
			done,
			{
				bin: {
					app: "yarn bin test file content",
				},
				"index.js": "",
				"package.json": JSON.stringify({
					bin: { bin: "./bin/app" },
					files: ["index.js"],
				}),
			},
			["index.js", "package.json", "bin/", "bin/app"],
		)
	})
})
