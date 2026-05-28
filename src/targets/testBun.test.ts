import type { NestedDirectoryJSON } from "memfs"

import type { PathHandlerOptions } from "../testScan.test.js"

import { describe, expect, test } from "bun:test"

import { testScan } from "../testScan.test.js"
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

const packageJsonNoFiles = JSON.stringify({
	name: "me",
	version: "0.0.1",
})

describe("Bun", () => {
	test("includes package.json and README by default", async (done) => {
		await testBun(done, { "README.md": "", "package.json": packageJsonNoFiles }, [
			"package.json",
			"README.md",
		])
	})

	test("ignores node_modules", async (done) => {
		await testBun(done, { node_modules: { a: "" }, "package.json": packageJsonNoFiles }, [
			"package.json",
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
