import { test, describe } from "node:test"
import { Git as target } from "./git.js"
import { testScan, type PathHandlerOptions } from "../0_testScan.test.js"
import type { NestedDirectoryJSON } from "memfs"

function testGit(
	tree: NestedDirectoryJSON,
	handler: ((o: PathHandlerOptions) => void | Promise<void>) | string[],
) {
	return testScan(tree, handler, { target })
}

void describe("Git", () => {
	void test("empty for empty", async () => {
		await testGit({ ".": null }, [])
	})

	void test("keeps for no sources", async () => {
		await testGit({ file: "" }, ["file"])
	})

	void test("keeps for empty source", async () => {
		await testGit(
			{
				file: "",
				".gitignore": "",
			},
			["file", ".gitignore"],
		)
	})

	void test("ignores .git/", async () => {
		await testGit(
			{
				".git/HEAD": "",
				file: "",
			},
			["file"],
		)
	})

	void test("ignores file (.git/info/exclude)", async () => {
		await testGit(
			{
				filei: "",
				file: "",
				".git/info/exclude": "filei",
			},
			["file"],
		)
	})

	void test("ignores file", async () => {
		await testGit(
			{
				filei: "",
				".gitignore": "filei",
			},
			[".gitignore"],
		)
	})

	void test("ignores multiple files", async () => {
		await testGit(
			{
				"file1.txt": "",
				"file2.txt": "",
				".gitignore": "file1.txt\nfile2.txt",
			},
			[".gitignore"],
		)
	})

	void test("ignores files with pattern", async () => {
		await testGit(
			{
				"foo.js": "",
				"bar.js": "",
				".gitignore": "*.js",
			},
			[".gitignore"],
		)
	})

	void test("ignores files in subdirectory", async () => {
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

	void test("does not ignore files not matching pattern", async () => {
		await testGit(
			{
				"foo.txt": "",
				"bar.js": "",
				".gitignore": "*.js",
			},
			["foo.txt", ".gitignore"],
		)
	})

	void test("negation pattern keeps file", async () => {
		await testGit(
			{
				"foo.js": "",
				"negkeep.js": "",
				".gitignore": "*.js\n!negkeep.js",
			},
			["negkeep.js", ".gitignore"],
		)
	})
})
