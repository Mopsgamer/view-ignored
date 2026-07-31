// Original test case verifying npm-packlist behavior for package-json-files-with-slashes.
// https://github.com/npm/npm-packlist/blob/d1eed617b1ff1eedf5909efec7867aee385d0350/test/package-json-files-with-slashes.js

import { describe, test } from "bun:test"

import { makeNPM } from "../targets/npm.js"
import { testScan } from "../testScan.test.js"

describe.skipIf(!process.env.TEST_PACKLIST)("npm-packlist package-json-files-with-slashes", () => {
	test("package with slash files", async (done) => {
		await testScan(
			done,
			{
				"fiv.js": "fiv",
				lib: {
					".DS_Store": "a store of ds",
					".npmignore": "two.js",
					"fiv.js": "fiv",
					"for.js": "for",
					"one.js": "one",
					"tre.js": "tre",
					"two.js": "two",
				},
				"package.json": JSON.stringify({
					files: ["./fiv.js", "/lib/one.js", "/lib/two.js", "/lib/tre.js", "./lib/for.js"],
					name: "test-package",
					version: "1.0.0",
				}),
			},
			["fiv.js", "lib/for.js", "lib/one.js", "lib/tre.js", "package.json"],
			{ target: makeNPM(), dirs: false },
		)
	})
})
