/* eslint-disable sort-keys */
import { describe, test } from "bun:test"

import { runPacklistTest } from "./runPacklistTest.js"

describe("package-json-files-including-npmignore", () => {
	// https://github.com/npm/npm-packlist/blob/79d3761d6ab491ceeb192e2b88d0853d57048768/test/package-json-files-including-npmignore.js#L32
	test("package with negated files", () =>
		runPacklistTest(
			{
				"package.json": JSON.stringify({
					files: ["lib/sub/*.js", "lib/.npmignore"],
				}),
				lib: {
					".npmignore": "two.js",
					sub: {
						"one.js": "one",
						"two.js": "two",
						"tre.js": "tre",
						"for.js": "for",
					},
					".DS_Store": "a store of ds",
				},
			},
			["lib/sub/for.js", "lib/sub/one.js", "lib/sub/tre.js", "package.json"],
			{},
		))
})
