import { describe, test, expect } from "bun:test"

import { testScan } from "../testScan.test.js"
import { makeVSCE } from "./vsce.js"

const packageJson = JSON.stringify({
	engines: { vscode: "^1.0.0" },
	name: "vsce-test",
	version: "1.0.0",
})

describe("VSCE", () => {
	test("includes package.json", async (done) => {
		await testScan(
			done,
			{ "extension.js": "", "package.json": packageJson },
			["package.json", "extension.js"],
			{ target: makeVSCE() },
		)
	})

	test("ignores .vscode-test", async (done) => {
		await testScan(
			done,
			{ ".vscode-test": { a: "" }, "package.json": packageJson },
			["package.json", ".vscode-test/", ".vscode-test/a"],
			{ target: makeVSCE() },
		)
	})

	test("throws an error if package.json is invalid", async (done) => {
		expect(() =>
			testScan(done, { "package.json": "{ invalid json }" }, () => {}, { target: makeVSCE() }),
		).toThrow()
		expect(() =>
			testScan(done, { "package.json": "{}" }, () => {}, { target: makeVSCE() }),
		).toThrow()
		expect(() =>
			testScan(done, { "package.json": '{ "name": 0, "version": 0 }' }, () => {}, {
				target: makeVSCE(),
			}),
		).toThrow()
		expect(() =>
			testScan(done, { "package.json": '{ "name": "test", "version": "1.0.0" }' }, () => {}, {
				target: makeVSCE(),
			}),
		).toThrow()
		expect(() =>
			testScan(
				done,
				{
					"package.json":
						'{ "name": "test", "version": "1.0.0", "engines": { "vscode": "^1.120.0" } }',
				},
				() => {},
				{ target: makeVSCE() },
			),
		).not.toThrow()
	})
})
