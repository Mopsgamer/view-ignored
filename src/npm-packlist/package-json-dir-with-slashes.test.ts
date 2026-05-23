/* eslint-disable sort-keys */
import { describe, test } from "bun:test"

import { runPacklistTest } from "./runPacklistTest.js"

describe("package-json-dir-with-slashes", () => {
	// https://github.com/npm/npm-packlist/blob/79d3761d6ab491ceeb192e2b88d0853d57048768/test/package-json-dir-with-slashes.js#L33
	test("package with slash directories", () =>
		runPacklistTest(
			{
				"package.json": JSON.stringify({
					files: ["/lib", "./lib2", "./lib3/*"],
				}),
				lib: {
					"one.js": "one",
					"two.js": "two",
					"tre.js": "tre",
					"for.js": "for",
					".npmignore": "two.js",
				},
				lib2: {
					"fiv.js": "fiv",
					".DS_Store": "a store of ds",
				},
				lib3: "not a dir",
			},
			["lib2/fiv.js", "lib/for.js", "lib/one.js", "lib/tre.js", "package.json"],
			{},
		))
})
