import { test, describe } from "node:test"
import { NPM as target } from "./npm.js"
import { testScan, type PathHandlerOptions } from "../0_testScan.test.js"
import type { NestedDirectoryJSON } from "memfs"

function testNpm(
	tree: NestedDirectoryJSON,
	handler: ((o: PathHandlerOptions) => void | Promise<void>) | string[],
) {
	return testScan(tree, handler, { target })
}

void describe("NPM", () => {
	void test("empty for empty", async () => {
		await testNpm({ ".": null }, [])
	})

	void test("keeps for no sources", async () => {
		await testNpm({ file: "" }, ["file"])
	})

	void test("keeps for empty source", async () => {
		await testNpm(
			{
				filekeep: "",
				".npmignore": "",
			},
			["filekeep"],
		)
	})

	void test("ignores file", async () => {
		await testNpm(
			{
				file: "",
				".npmignore": "file",
			},
			[],
		)
	})

	void test("ignores multiple files", async () => {
		await testNpm(
			{
				"file1.txt": "",
				"file2.txt": "",
				".npmignore": "file1.txt\nfile2.txt",
			},
			[],
		)
	})

	void test("ignores files with pattern", async () => {
		await testNpm(
			{
				"foo.js": "",
				"bar.js": "",
				".npmignore": "*.js",
			},
			[],
		)
	})

	void test("ignores files in subdirectory", async () => {
		await testNpm(
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

	void test("does not ignore files not matching pattern", async () => {
		await testNpm(
			{
				"foo.txt": "",
				"bar.js": "",
				".npmignore": "*.js",
			},
			["foo.txt"],
		)
	})

	void test("negation pattern keeps file", async () => {
		await testNpm(
			{
				"foo.js": "",
				"bar.js": "",
				".npmignore": "*.js\n!bar.js",
			},
			["bar.js"],
		)
	})
})
