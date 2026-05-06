import type { NestedDirectoryJSON } from "memfs"
import { describe, test } from "bun:test"
import { testScan, type PathHandlerOptions } from "../testScan.test.js"
import { YarnClassic as target } from "./yarnClassic.js"

function testYarnClassic(
	done: () => void,
	tree: NestedDirectoryJSON,
	handler: ((o: PathHandlerOptions) => void | Promise<void>) | string[],
) {
	return testScan(done, tree, handler, { target })
}

const packageJson = JSON.stringify({
	name: "yarn-classic-test",
	version: "1.0.0"
})

describe("Yarn Classic", () => {
	test("includes package.json", async (done) => {
		await testYarnClassic(done, { "package.json": packageJson, "index.js": "" }, ["package.json", "index.js"])
	})

	test("ignores node_modules", async (done) => {
		await testYarnClassic(done, { "package.json": packageJson, "node_modules": { "a": "" } }, ["package.json", "node_modules/", "node_modules/a"])
	})
})
