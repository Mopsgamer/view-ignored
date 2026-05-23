/* eslint-disable sort-keys */
import { describe, test } from "bun:test"

import { runPacklistTest } from "./runPacklistTest.js"

describe("cannot-include-package-lock", () => {
	// https://github.com/npm/npm-packlist/blob/79d3761d6ab491ceeb192e2b88d0853d57048768/test/cannot-include-package-lock.js#L18
	test("try to include package-lock.json but cannot", () =>
		runPacklistTest(
			{
				"package.json": JSON.stringify({
					files: [".npmignore", "package-lock.json"],
				}),
				".npmignore": `
!package-lock.json
`,
				"package-lock.json": "{}",
			},
			[".npmignore", "package.json"],
			{},
		))
})
