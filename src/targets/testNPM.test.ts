import { describe, test, expect } from "bun:test"
import { NPM as target } from "./npm.js"
import { testScan, type PathHandlerOptions } from "../testScan.test.js"
import type { NestedDirectoryJSON } from "memfs"
import { dirname } from "node:path"

function testNpm(
	done: () => void,
	tree: NestedDirectoryJSON,
	handler: ((o: PathHandlerOptions) => void | Promise<void>) | string[],
) {
	return testScan(done, tree, handler, { target })
}

describe("NPM", () => {
	test("empty for empty", async (done) => {
		await testNpm(done, { ".": null }, [])
	})

	test("keeps for no sources", async (done) => {
		await testNpm(done, { file: "" }, ["file"])
	})

	test("keeps for empty source", async (done) => {
		await testNpm(
			done,
			{
				filekeep: "",
				".npmignore": "",
			},
			["filekeep"],
		)
	})

	test("ignores file", async (done) => {
		await testNpm(
			done,
			{
				file: "",
				".npmignore": "file",
			},
			[],
		)
	})

	test("ignores multiple files", async (done) => {
		await testNpm(
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
		await testNpm(
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
		await testNpm(
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
		await testNpm(
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
		await testNpm(
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
		await testNpm(
			done,
			{
				"foo.js": "",
				"negkeep.js": "",
				"package.json": "{",
			},
			({ ctx }) => {
				expect(ctx.failed).toBeArray()
				expect(ctx.failed).not.toBeEmpty()
				const source = ctx.failed.find((fail) => dirname(fail.path) === ".")
				expect(source).toBeTruthy()
				expect(source!.error).toBeTruthy()
				expect(source!.error instanceof Error).toBeTruthy()
				expect((source!.error! as Error).message).toMatch("Expected")
			},
		)
	})
	test("monorepo should use root if cwd is root", async (done) => {
		await testScan(
			done,
			{
				packages: {
					a: {
						"index.js": "console.log('a')",
						"package.json": JSON.stringify({
							name: "a",
							version: "0.0.1",
							files: ["index.js"],
						}),
					},
				},
				file: "1",
				"index.js": "console.log('src')",
				"index.ts": "console.log('src')",
				"package.json": JSON.stringify({
					name: "root",
					version: "0.0.1",
					files: ["index.ts"],
				}),
			},
			({ ctx }) => {
				expect(ctx.paths.has("file")).toBeFalse()
				expect(ctx.paths.has("index.ts")).toBeTrue()
				expect(ctx.paths.has("index.js")).toBeFalse()
				expect(ctx.paths.has("packages/a/index.js")).toBeFalse()

				expect(ctx.paths.get("packages/a/")).toBeObject()
				expect(ctx.paths.get("packages/a/")!.kind).toBe("no-match")

				expect(ctx.external.get("packages/a")?.path).toBe("package.json")
			},
			{ target, cwd: process.cwd() + '/test' },
		)
	})
    test("monorepo should use children if cwd is children", async (done) => {
		await testScan(
			done,
			{
				packages: {
					a: {
						"index.js": "console.log('a')",
						"package.json": JSON.stringify({
							name: "a",
							version: "0.0.1",
							files: ["index.js"],
						}),
					},
				},
				file: "1",
				"index.js": "console.log('src')",
				"index.ts": "console.log('src')",
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
                expect(ctx.external.get(".")?.path).toBe("package.json")
			},
			{ target, cwd: process.cwd() + '/test/packages/a' },
		)
	})
})
