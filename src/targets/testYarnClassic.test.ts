import type { NestedDirectoryJSON } from "memfs"

import { describe, test, expect } from "bun:test"

import { testScan, type PathHandlerOptions } from "../testScan.test.js"
import { YarnClassic as target } from "./yarnClassic.js"

async function testYarnClassic(
	done: () => void,
	tree: NestedDirectoryJSON,
	handler: ((o: PathHandlerOptions) => void | Promise<void>) | string[],
) {
	try {
		await testScan(done, tree, handler, { target })
	} catch (error) {
		throw new Error("Error while testing Yarn Classic", { cause: error })
	}
}

const packageJson = JSON.stringify({
	name: "yarn-classic-test",
	version: "1.0.0",
})

describe("Yarn Classic", () => {
	test("includes package.json", async (done) => {
		await testYarnClassic(done, { "index.js": "", "package.json": packageJson }, [
			"package.json",
			"index.js",
		])
	})

	test("ignores node_modules", async (done) => {
		await testYarnClassic(done, { node_modules: { a: "" }, "package.json": packageJson }, [
			"package.json",
			"node_modules/",
			"node_modules/a",
		])
	})
	test("throws an error if package.json is invalid", async (done) => {
		expect(() => testYarnClassic(done, { "package.json": "{ invalid json }" }, () => {})).toThrow()
		expect(() => testYarnClassic(done, { "package.json": "{}" }, () => {})).toThrow()
		expect(() =>
			testYarnClassic(done, { "package.json": '{ "name": 0, "version": 0 }' }, () => {}),
		).toThrow()
	})
})
