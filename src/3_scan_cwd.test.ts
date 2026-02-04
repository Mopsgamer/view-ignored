import { describe, test } from "bun:test"
import { testScan } from "./0_testScan.test.js"
import { Git as target } from "./targets/git.js"

function testCwd(done: () => void, cwd: string, paths: string[]): Promise<void> {
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
	test("works with relative cwd", async (done) => {
		await testCwd(done, "./test", ["file", "folder/", "folder/nested"])
		await testCwd(done, "test", ["file", "folder/", "folder/nested"])
		await testCwd(done, ".\\test", ["file", "folder/", "folder/nested"])
		await testCwd(done, "./", ["test/", "test/file", "test/folder/", "test/folder/nested"])
		await testCwd(done, ".\\", ["test/", "test/file", "test/folder/", "test/folder/nested"])
	})
})
