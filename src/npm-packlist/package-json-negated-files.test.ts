/* eslint-disable sort-keys */
import { describe, test } from "bun:test"

import { runPacklistTest } from "./runPacklistTest.js"

describe("package-json-negated-files", () => {
	// https://github.com/npm/npm-packlist/blob/79d3761d6ab491ceeb192e2b88d0853d57048768/test/package-json-negated-files.js#L24
	test("package with negated files", () =>
		runPacklistTest(
			{
				"package.json": JSON.stringify({
					files: ["lib", "!lib/one"],
				}),
				lib: {
					one: "one",
					two: "two",
					tre: "tre",
					for: "for",
					".npmignore": "two",
					".DS_Store": "a store of ds",
				},
			},
			["lib/for", "lib/tre", "package.json"],
			{},
		))
})
