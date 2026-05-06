import type { NestedDirectoryJSON } from "memfs"
import { describe, test } from "bun:test"
import { testScan, type PathHandlerOptions } from "../testScan.test.js"
import { VSCE as target } from "./vsce.js"

function testVsce(
	done: () => void,
	tree: NestedDirectoryJSON,
	handler: ((o: PathHandlerOptions) => void | Promise<void>) | string[],
) {
	return testScan(done, tree, handler, { target })
}

const packageJson = JSON.stringify({
	name: "vsce-test",
	version: "1.0.0",
	engines: { vscode: "^1.0.0" }
})

describe("VSCE", () => {
	test("includes package.json", async (done) => {
		await testVsce(done, { "package.json": packageJson, "extension.js": "" }, ["package.json", "extension.js"])
	})

	test("ignores .vscode-test", async (done) => {
		await testVsce(done, { "package.json": packageJson, ".vscode-test": { "a": "" } }, ["package.json", ".vscode-test/", ".vscode-test/a"])
	})
})
