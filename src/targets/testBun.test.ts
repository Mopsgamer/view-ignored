import type { NestedDirectoryJSON } from "memfs"

import { describe, test, expect } from "bun:test"

import { testScan, type PathHandlerOptions } from "../testScan.test.js"
import { Bun as target } from "./bun.js"

async function testBun(
	done: () => void,
	tree: NestedDirectoryJSON,
	handler: ((o: PathHandlerOptions) => void | Promise<void>) | string[],
) {
	try {
		await testScan(done, tree, handler, { target })
	} catch (error) {
		throw new Error("Error while testing Bun", { cause: error })
	}
}

const packageJson = JSON.stringify({
	name: "bun-test",
	version: "1.0.0",
})

describe("Bun", () => {
	test("includes package.json and README by default", async (done) => {
		await testBun(done, { "README.md": "", "package.json": packageJson }, [
			"package.json",
			"README.md",
		])
	})

	test("ignores node_modules", async (done) => {
		await testBun(done, { node_modules: { a: "" }, "package.json": packageJson }, [
			"package.json",
			"node_modules/",
			"node_modules/a",
		])
	})

	test("throws an error if package.json is invalid", async (done) => {
		expect(() => testBun(done, { "package.json": "{ invalid json }" }, () => {})).toThrow()
		expect(() => testBun(done, { "package.json": "{}" }, () => {})).toThrow()
		expect(() =>
			testBun(done, { "package.json": '{ "name": 0, "version": 0 }' }, () => {}),
		).toThrow()
	})
})
