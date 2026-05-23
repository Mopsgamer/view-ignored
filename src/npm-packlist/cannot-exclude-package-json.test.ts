/* eslint-disable sort-keys */
import { describe, test } from "bun:test"

import { runPacklistTest } from "./runPacklistTest.js"

describe("cannot-exclude-package-json", () => {
	// https://github.com/npm/npm-packlist/blob/79d3761d6ab491ceeb192e2b88d0853d57048768/test/cannot-exclude-package-json.js#L15
	test("try to exclude package.json but cannot", () =>
		runPacklistTest(
			{
				"package.json": JSON.stringify({
					files: [".npmignore", "!package.json"],
				}),
				".npmignore": "package.json",
			},
			[".npmignore", "package.json"],
			{},
		))
})
