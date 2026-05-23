/* eslint-disable sort-keys */
import { describe, test } from "bun:test"

import { runPacklistTest } from "./runPacklistTest.js"

describe("can-exclude-shrinkwrap", () => {
	// https://github.com/npm/npm-packlist/blob/79d3761d6ab491ceeb192e2b88d0853d57048768/test/can-exclude-shrinkwrap.js#L16
	test("package with negated files", () =>
		runPacklistTest(
			{
				"package.json": JSON.stringify({
					files: [".npmignore", "!npm-shrinkwrap.json"],
				}),
				".npmignore": "npm-shrinkwrap.json",
				"npm-shrinkwrap.json": "{}",
			},
			[".npmignore", "package.json"],
			{},
		))
})
