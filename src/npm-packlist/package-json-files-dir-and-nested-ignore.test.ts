/* eslint-disable sort-keys */
import { describe, test } from "bun:test"

import { runPacklistTest } from "./runPacklistTest.js"

describe("package-json-files-dir-and-nested-ignore", () => {
	// https://github.com/npm/npm-packlist/blob/79d3761d6ab491ceeb192e2b88d0853d57048768/test/package-json-files-dir-and-nested-ignore.js#L25
	test("package with negated files", () =>
		runPacklistTest(
			{
				"package.json": JSON.stringify({
					files: ["lib"],
				}),
				lib: {
					"one.js": "one",
					"two.js": "two",
					"tre.js": "tre",
					"for.js": "for",
					".npmignore": "two.js",
					".DS_Store": "a store of ds",
				},
			},
			["lib/for.js", "lib/one.js", "lib/tre.js", "package.json"],
			{},
		))
})
