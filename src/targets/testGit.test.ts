import { test, describe } from "bun:test"
import { ok, equal } from "node:assert/strict"
import { Git as target } from "./git.js"
import { testScan, type PathHandlerOptions } from "../testScan.test.js"
import type { NestedDirectoryJSON } from "memfs"

function testGit(
	done: () => void,
	tree: NestedDirectoryJSON,
	handler: ((o: PathHandlerOptions) => void | Promise<void>) | string[],
) {
	return testScan(done, tree, handler, { target })
}

describe("Git", () => {
	test("empty for empty", async (done) => {
		await testGit(done, { ".": null }, [])
	})

	test("keeps for no sources", async (done) => {
		await testGit(done, { file: "" }, ["file"])
	})

	test("keeps for empty source", async (done) => {
		await testGit(
			done,
			{
				file: "",
				".gitignore": "",
			},
			["file", ".gitignore"],
		)
	})

	test("ignores .git/", async (done) => {
		await testGit(
			done,
			{
				".git/HEAD": "",
				file: "",
			},
			["file"],
		)
	})

	test("ignores file (.git/info/exclude)", async (done) => {
		await testGit(
			done,
			{
				filei: "",
				file: "",
				".git/info/exclude": "filei",
			},
			["file"],
		)
	})

	test("ignores file", async (done) => {
		await testGit(
			done,
			{
				filei: "",
				".gitignore": "filei",
			},
			[".gitignore"],
		)
	})

	test("ignores multiple files", async (done) => {
		await testGit(
			done,
			{
				"file1.txt": "",
				"file2.txt": "",
				".gitignore": "file1.txt\nfile2.txt",
			},
			[".gitignore"],
		)
	})

	test("ignores files with pattern", async (done) => {
		await testGit(
			done,
			{
				"foo.js": "",
				"bar.js": "",
				".gitignore": "*.js",
			},
			[".gitignore"],
		)
	})

	test("ignores files in subdirectory", async (done) => {
		await testGit(
			done,
			{
				src: {
					"main.js": "",
					"helper.js": "",
				},
				".gitignore": "src/",
			},
			[".gitignore"],
		)
	})

	test("does not ignore files not matching pattern", async (done) => {
		await testGit(
			done,
			{
				"foo.txt": "",
				"bar.js": "",
				".gitignore": "*.js",
			},
			["foo.txt", ".gitignore"],
		)
	})

	test("negation pattern keeps file", async (done) => {
		await testGit(
			done,
			{
				"foo.js": "",
				"negkeep.js": "",
				".gitignore": "*.js\n!negkeep.js",
			},
			["negkeep.js", ".gitignore"],
		)
	})

	test.skip("collects errors", async (done) => {
		await testGit(
			done,
			{
				"foo.js": "",
				"negkeep.js": "",
				".gitignore": "\\",
			},
			({ ctx }) => {
				ok(ctx.failed.length)
				const source = ctx.external.get(".")
				ok(source)
				ok(source.error)
				ok(source.error instanceof Error)
				equal(source.error.message, "Invalid usage of '/'")
			},
		)
	})
})
