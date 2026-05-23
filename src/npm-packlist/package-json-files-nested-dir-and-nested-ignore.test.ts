/* eslint-disable sort-keys */
import { describe, test } from "bun:test"

import { runPacklistTest } from "./runPacklistTest.js"

describe("package-json-files-nested-dir-and-nested-ignore", () => {
	// https://github.com/npm/npm-packlist/blob/79d3761d6ab491ceeb192e2b88d0853d57048768/test/package-json-files-nested-dir-and-nested-ignore.js#L27
	test("package with negated files", () =>
		runPacklistTest(
			{
				"package.json": JSON.stringify({
					files: ["lib/dir"],
				}),
				lib: {
					dir: {
						"one.js": "one",
						"two.js": "two",
						"tre.js": "tre",
						"for.js": "for",
					},
					".npmignore": "dir/two.js",
					".DS_Store": "a store of ds",
				},
			},
			["lib/dir/for.js", "lib/dir/one.js", "lib/dir/tre.js", "package.json"],
			{},
		))
})
