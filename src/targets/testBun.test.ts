import type { NestedDirectoryJSON } from "memfs"
import { describe, test } from "bun:test"
import { testScan, type PathHandlerOptions } from "../testScan.test.js"
import { Bun as target } from "./bun.js"

function testBun(
	done: () => void,
	tree: NestedDirectoryJSON,
	handler: ((o: PathHandlerOptions) => void | Promise<void>) | string[],
) {
	return testScan(done, tree, handler, { target })
}

const packageJson = JSON.stringify({
	name: "bun-test",
	version: "1.0.0",
})

describe("Bun", () => {
	test("includes package.json and README by default", async (done) => {
		await testBun(done, { "package.json": packageJson, "README.md": "" }, ["package.json", "README.md"])
	})

	test("ignores node_modules", async (done) => {
		await testBun(done, { "package.json": packageJson, "node_modules": { "a": "" } }, ["package.json", "node_modules/", "node_modules/a"])
	})
})
