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
})
