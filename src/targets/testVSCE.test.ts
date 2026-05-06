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
	engines: { vscode: "^1.0.0" },
	name: "vsce-test",
	version: "1.0.0",
})

describe("VSCE", () => {
	test("includes package.json", async (done) => {
		await testVsce(done, { "extension.js": "", "package.json": packageJson }, [
			"package.json",
			"extension.js",
		])
	})

	test("ignores .vscode-test", async (done) => {
		await testVsce(done, { ".vscode-test": { a: "" }, "package.json": packageJson }, [
			"package.json",
			".vscode-test/",
			".vscode-test/a",
		])
	})
})
