import { describe, test, expect } from "bun:test"

import { testScan } from "../testScan.test.js"
import { makeBun } from "./bun.js"

const packageJson = JSON.stringify({
	name: "bun-test",
	version: "1.0.0",
})

describe("Bun", () => {
	test("includes package.json and README by default", async (done) => {
		await testScan(
			done,
			{ "README.md": "", "package.json": packageJson },
			["package.json", "README.md"],
			{ target: makeBun() },
		)
	})

	test("ignores node_modules", async (done) => {
		await testScan(
			done,
			{ node_modules: { a: "" }, "package.json": packageJson },
			["package.json", "node_modules/", "node_modules/a"],
			{ target: makeBun() },
		)
	})

	test("throws an error if package.json is invalid", async (done) => {
		expect(() =>
			testScan(done, { "package.json": "{ invalid json }" }, () => {}, { target: makeBun() }),
		).toThrow()
		expect(() =>
			testScan(done, { "package.json": "{}" }, () => {}, { target: makeBun() }),
		).toThrow()
		expect(() =>
			testScan(done, { "package.json": '{ "name": 0, "version": 0 }' }, () => {}, {
				target: makeBun(),
			}),
		).toThrow()
	})
})
