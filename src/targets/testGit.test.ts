import type { NestedDirectoryJSON } from "memfs"

import { test, describe } from "bun:test"

import { testScan, type PathHandlerOptions } from "../testScan.test.js"
import { Git as target } from "./git.js"

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

	test("includes for no sources", async (done) => {
		await testGit(done, { file: "" }, ["file"])
	})

	test("keeps for empty source", async (done) => {
		await testGit(
			done,
			{
				".gitignore": "",
				file: "",
			},
			["file", ".gitignore"],
		)
	})

	test("ignores .git/", async (done) => {
		await testGit(
			done,
			{
				".git/HEAD": "",
				".gitignore": "",
				file: "",
			},
			["file", ".gitignore"],
		)
	})

	test("ignores filei (.git/info/exclude)", async (done) => {
		await testGit(
			done,
			{
				".git/info/exclude": "filei",
				file: "",
				filei: "",
			},
			["file"],
		)
	})

	test("ignores filei", async (done) => {
		await testGit(
			done,
			{
				".gitignore": "filei",
				filei: "",
			},
			[".gitignore"],
		)
	})

	test("includes file (case File no match)", async (done) => {
		await testGit(
			done,
			{
				".gitignore": "File",
				file: "",
			},
			[".gitignore", "file"],
		)
	})

	test("ignores multiple files", async (done) => {
		await testGit(
			done,
			{
				".gitignore": "file1.txt\nfile2.txt",
				"file1.txt": "",
				"file2.txt": "",
			},
			[".gitignore"],
		)
	})

	test("ignores files with pattern", async (done) => {
		await testGit(
			done,
			{
				".gitignore": "*.js",
				"bar.js": "",
				"foo.js": "",
			},
			[".gitignore"],
		)
	})

	test("ignores files in subdirectory", async (done) => {
		await testGit(
			done,
			{
				".gitignore": "src/",
				out: {
					"helper.js": "",
					"main.js": "",
				},
				src: {
					"helper.js": "",
					"main.js": "",
				},
			},
			[".gitignore", "out/", "out/main.js", "out/helper.js"],
		)
	})

	test("does not ignore files not matching pattern", async (done) => {
		await testGit(
			done,
			{
				".gitignore": "*.js",
				"bar.js": "",
				"foo.txt": "",
			},
			["foo.txt", ".gitignore"],
		)
	})

	test("negation pattern keeps file", async (done) => {
		await testGit(
			done,
			{
				".gitignore": "*.js\n!negkeep.js",
				"foo.js": "",
				"negkeep.js": "",
			},
			["negkeep.js", ".gitignore"],
		)
	})
})
