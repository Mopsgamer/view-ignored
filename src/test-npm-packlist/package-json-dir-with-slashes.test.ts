import { describe, test } from "bun:test"

import { makeNPM } from "../targets/npm.js"
import { testScan } from "../testScan.test.js"

describe.skipIf(!process.env.TEST_PACKLIST)("npm-packlist package-json-dir-with-slashes", () => {
	test("package with slash directories", async (done) => {
		await testScan(
			done,
			{
				lib: {
					".npmignore": "two.js",
					"for.js": "for",
					"one.js": "one",
					"tre.js": "tre",
					"two.js": "two",
				},
				lib2: {
					".DS_Store": "a store of ds",
					"fiv.js": "fiv",
				},
				lib3: "not a dir",
				"package.json": JSON.stringify({
					files: ["/lib", "./lib2", "./lib3/*"],
					name: "test-package",
					version: "1.0.0",
				}),
			},
			["lib2/fiv.js", "lib/for.js", "lib/one.js", "lib/tre.js", "package.json"],
			{ target: makeNPM() },
		)
	})
})
