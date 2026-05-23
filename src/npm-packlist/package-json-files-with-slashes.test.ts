/* eslint-disable sort-keys */
import { describe, test } from "bun:test"

import { runPacklistTest } from "./runPacklistTest.js"

describe("package-json-files-with-slashes", () => {
	// https://github.com/npm/npm-packlist/blob/79d3761d6ab491ceeb192e2b88d0853d57048768/test/package-json-files-with-slashes.js#L35
	test("package with slash files", () =>
		runPacklistTest(
			{
				"package.json": JSON.stringify({
					files: ["./fiv.js", "/lib/one.js", "/lib/two.js", "/lib/tre.js", "./lib/for.js"],
				}),
				"fiv.js": "fiv",
				lib: {
					"one.js": "one",
					"two.js": "two",
					"tre.js": "tre",
					"for.js": "for",
					"fiv.js": "fiv",
					".npmignore": "two.js",
					".DS_Store": "a store of ds",
				},
			},
			["fiv.js", "lib/for.js", "lib/one.js", "lib/tre.js", "package.json"],
			{},
		))
})
