/* eslint-disable sort-keys */
import { describe, test } from "bun:test"

import { runPacklistTest } from "./runPacklistTest.js"

describe("cannot-exclude-readme", () => {
	// https://github.com/npm/npm-packlist/blob/79d3761d6ab491ceeb192e2b88d0853d57048768/test/cannot-exclude-readme.js#L21
	test("try to exclude package.json but cannot", () =>
		runPacklistTest(
			{
				"package.json": JSON.stringify({
					files: [".npmignore", "!readme.md"],
				}),
				".npmignore": "readme.md\nlicense.md\nhistory.md\n*.xyz",
				"readme.md": "hello",
				"license.md": "hello",
				"history.md": "hello",
				"changes.md": "hello",
				"changelog.xyz": "hello",
				"notice.md": "hello",
			},
			[".npmignore", "package.json", "license.md", "readme.md"],
			{},
		))
})
