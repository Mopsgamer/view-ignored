import { describe, test, expect } from "bun:test"

import { testScan } from "../testScan.test.js"
import { makeYarnClassic } from "./yarnClassic.js"

const packageJson = JSON.stringify({
	name: "yarn-classic-test",
	version: "1.0.0",
})

describe("Yarn Classic", () => {
	test("includes package.json", async (done) => {
		await testScan(
			done,
			{ "index.js": "", "package.json": packageJson },
			["package.json", "index.js"],
			{ target: makeYarnClassic() },
		)
	})

	test("ignores node_modules", async (done) => {
		await testScan(
			done,
			{ node_modules: { a: "" }, "package.json": packageJson },
			["package.json", "node_modules/", "node_modules/a"],
			{ target: makeYarnClassic() },
		)
	})
	test("throws an error if package.json is invalid", async (done) => {
		expect(() =>
			testScan(done, { "package.json": "{ invalid json }" }, () => {}, {
				target: makeYarnClassic(),
			}),
		).toThrow()
		expect(() =>
			testScan(done, { "package.json": "{}" }, () => {}, { target: makeYarnClassic() }),
		).toThrow()
		expect(() =>
			testScan(done, { "package.json": '{ "name": 0, "version": 0 }' }, () => {}, {
				target: makeYarnClassic(),
			}),
		).toThrow()
	})
})
