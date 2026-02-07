import { describe, test, expect } from "bun:test"
import { testScan, type PathHandlerOptions } from "./testScan.test.js"
import { Git as target } from "./targets/git.js"
import { sortFirstFolders } from "./testSort.test.js"
import { minimatch } from "minimatch"

function testCwd(
	done: () => void,
	cwd: string,
	paths: string[] | ((o: PathHandlerOptions) => void | Promise<void>),
): Promise<void> {
	return testScan(
		done,
		{
			".git/HEAD": "",
			file: "",
			folder: { nested: "" },
		},
		paths,
		{ target, cwd },
	)
}

describe("Git", () => {
	test("cwd works with ./test", async (done) => {
		await testCwd(done, "./test", ["file", "folder/", "folder/nested"])
	})
	test("cwd works with ./test/folder", async (done) => {
		await testCwd(done, "./test/folder", ["nested"])
	})
	test("cwd works with .\\test", async (done) => {
		await testCwd(done, ".\\test", ["file", "folder/", "folder/nested"])
	})
	test("cwd works with test", async (done) => {
		await testCwd(done, "test", ["file", "folder/", "folder/nested"])
	})
	test("cwd works with ./", async (done) => {
		await testCwd(done, "./", ["test/", "test/file", "test/folder/", "test/folder/nested"])
	})
	test("cwd works with ../", async (done) => {
		await testCwd(done, "../", ({ ctx: { paths: map } }) => {
			const paths = sortFirstFolders(map.keys())
			expect(paths.length).toBe(5)
			expect(minimatch.match([paths[0]!], "*/")).not.toBeEmpty()
			expect(minimatch.match([paths[1]!], "*/test/")).not.toBeEmpty()
			expect(minimatch.match([paths[2]!], "*/test/folder/")).not.toBeEmpty()
			expect(minimatch.match([paths[3]!], "*/test/folder/nested")).not.toBeEmpty()
			expect(minimatch.match([paths[4]!], "*/test/file")).not.toBeEmpty()
		})
	})
	test("cwd works with ../../", async (done) => {
		await testCwd(done, "../../", ({ ctx: { paths: map } }) => {
			const paths = sortFirstFolders(map.keys())
			expect(paths.length).toBe(6)
			expect(minimatch.match([paths[0]!], "*/")).not.toBeEmpty()
			expect(minimatch.match([paths[1]!], "*/*/")).not.toBeEmpty()
			expect(minimatch.match([paths[2]!], "*/*/test/")).not.toBeEmpty()
			expect(minimatch.match([paths[3]!], "*/*/test/folder/")).not.toBeEmpty()
			expect(minimatch.match([paths[4]!], "*/*/test/folder/nested")).not.toBeEmpty()
			expect(minimatch.match([paths[5]!], "*/*/test/file")).not.toBeEmpty()
		})
	})
	test("absolute cwd works with process.cwd()/test", async (done) => {
		await testCwd(done, process.cwd() + "/test", ["file", "folder/", "folder/nested"])
	})
	test("absolute cwd works with process.cwd()/test/folder", async (done) => {
		await testCwd(done, process.cwd() + "/test/folder", ["nested"])
	})
})
