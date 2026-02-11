import { describe, test } from "bun:test"

import { Git as target } from "./targets/git.js"
import { testScan, type PathHandlerOptions } from "./testScan.test.js"

function testCwd(
	done: () => void,
	cwd: string,
	within: string,
	paths: string[] | ((o: PathHandlerOptions) => void | Promise<void>),
): Promise<void> {
	return testScan(
		done,
		{
			".git/HEAD": "",
			file: "",
			folder: { nested: "" },
			".gitignore": "",
		},
		paths,
		{ target, cwd, within },
	)
}

describe("Git", () => {
	test("cwd works with ./test", async (done) => {
		await testCwd(done, "./test", ".", ["file", ".gitignore", "folder/", "folder/nested"])
	})
	test("cwd works with ./test/folder", async (done) => {
		await testCwd(done, "./test", "./folder", ["folder/nested"])
	})
	test("cwd works with .\\test", async (done) => {
		await testCwd(done, ".\\test", ".", ["file", ".gitignore", "folder/", "folder/nested"])
	})
	test("cwd works with test", async (done) => {
		await testCwd(done, "test", ".", ["file", ".gitignore", "folder/", "folder/nested"])
	})
	test("absolute cwd works with process.cwd()/test", async (done) => {
		await testCwd(done, process.cwd() + "/test", ".", [
			"file",
			".gitignore",
			"folder/",
			"folder/nested",
		])
	})
	test("absolute cwd works with process.cwd()/test/folder", async (done) => {
		await testCwd(done, process.cwd() + "/test", "./folder", ["folder/nested"])
	})
})
