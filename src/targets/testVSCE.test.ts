import type { NestedDirectoryJSON } from "memfs"

import { describe, test, expect } from "bun:test"

import { testScan, type PathHandlerOptions } from "../testScan.test.js"
import { VSCE as target } from "./vsce.js"

async function testVSCE(
	done: () => void,
	tree: NestedDirectoryJSON,
	handler: ((o: PathHandlerOptions) => void | Promise<void>) | string[],
) {
	try {
		await testScan(done, tree, handler, { target })
	} catch (error) {
		throw new Error("Error while testing VSCE", { cause: error })
	}
}

const packageJson = JSON.stringify({
	engines: { vscode: "^1.0.0" },
	name: "vsce-test",
	version: "1.0.0",
})

describe("VSCE", () => {
	test("includes package.json", async (done) => {
		await testVSCE(done, { "extension.js": "", "package.json": packageJson }, [
			"package.json",
			"extension.js",
		])
	})

	test("ignores .vscode-test", async (done) => {
		await testVSCE(done, { ".vscode-test": { a: "" }, "package.json": packageJson }, [
			"package.json",
		])
	})

	test("throws an error if package.json is invalid", async (done) => {
		expect(() => testVSCE(done, { "package.json": "{ invalid json }" }, () => {})).toThrow()
		expect(() => testVSCE(done, { "package.json": "{}" }, () => {})).toThrow()
		expect(() =>
			testVSCE(done, { "package.json": '{ "name": 0, "version": 0 }' }, () => {}),
		).toThrow()
		expect(() =>
			testVSCE(done, { "package.json": '{ "name": "test", "version": "1.0.0" }' }, () => {}),
		).toThrow()
		expect(() =>
			testVSCE(
				done,
				{
					"package.json":
						'{ "name": "test", "version": "1.0.0", "engines": { "vscode": "^1.120.0" } }',
				},
				() => {},
			),
		).not.toThrow()
	})
})
