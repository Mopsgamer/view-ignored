import { describe, test } from "bun:test"

import { makeNPM } from "../targets/npm.js"
import { testScan } from "../testScan.test.js"

describe.skipIf(!process.env.TEST_PACKLIST)("npm-packlist package-json-negated-files", () => {
	test("package with negated files", async (done) => {
		await testScan(
			done,
			{
				lib: {
					".DS_Store": "a store of ds",
					".npmignore": "two",
					for: "for",
					one: "one",
					tre: "tre",
					two: "two",
				},
				"package.json": JSON.stringify({
					files: ["lib", "!lib/one"],
					name: "test-package",
					version: "1.0.0",
				}),
			},
			["lib/for", "lib/tre", "package.json"],
			{ target: makeNPM() },
		)
	})
})
