import { test, describe } from "bun:test"
import { ok, equal } from "node:assert/strict"
import { Git as target } from "./git.js"
import { testScan, type PathHandlerOptions } from "../0_testScan.test.js"
import type { NestedDirectoryJSON } from "memfs"

function testGit(
	tree: NestedDirectoryJSON,
	handler: ((o: PathHandlerOptions) => void | Promise<void>) | string[],
) {
	return testScan(tree, handler, { target })
}

describe("Git", () => {
	test("empty for empty", async () => {
		await testGit({ ".": null }, [])
	})

	test("keeps for no sources", async () => {
		await testGit({ file: "" }, ["file"])
	})

	test("keeps for empty source", async () => {
		await testGit(
			{
				file: "",
				".gitignore": "",
			},
			["file", ".gitignore"],
		)
	})

	test("ignores .git/", async () => {
		await testGit(
			{
				".git/HEAD": "",
				file: "",
			},
			["file"],
		)
	})

	test("ignores file (.git/info/exclude)", async () => {
		await testGit(
			{
				filei: "",
				file: "",
				".git/info/exclude": "filei",
			},
			["file"],
		)
	})

	test("ignores file", async () => {
		await testGit(
			{
				filei: "",
				".gitignore": "filei",
			},
			[".gitignore"],
		)
	})

	test("ignores multiple files", async () => {
		await testGit(
			{
				"file1.txt": "",
				"file2.txt": "",
				".gitignore": "file1.txt\nfile2.txt",
			},
			[".gitignore"],
		)
	})

	test("ignores files with pattern", async () => {
		await testGit(
			{
				"foo.js": "",
				"bar.js": "",
				".gitignore": "*.js",
			},
			[".gitignore"],
		)
	})

	test("ignores files in subdirectory", async () => {
		await testGit(
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

	test("does not ignore files not matching pattern", async () => {
		await testGit(
			{
				"foo.txt": "",
				"bar.js": "",
				".gitignore": "*.js",
			},
			["foo.txt", ".gitignore"],
		)
	})

	test("negation pattern keeps file", async () => {
		await testGit(
			{
				"foo.js": "",
				"negkeep.js": "",
				".gitignore": "*.js\n!negkeep.js",
			},
			["negkeep.js", ".gitignore"],
		)
	})

	test.skip("collects errors", async () => {
		await testGit(
			{
				"foo.js": "",
				"negkeep.js": "",
				".gitignore": "\\",
			},
			({ ctx }) => {
				ok(ctx.failed)
				const source = ctx.external.get(".")
				ok(source)
				ok(source.error)
				ok(source.error instanceof Error)
				equal(source.error.message, "Invalid usage of '/'")
			},
		)
	})
})
