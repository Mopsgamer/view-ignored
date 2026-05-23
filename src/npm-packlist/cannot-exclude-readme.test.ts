import { describe, test } from "bun:test"

import { runPacklistTest } from "./runPacklistTest.js"

describe("cannot-exclude-readme", () => {
	test("try to exclude package.json but cannot", async () => {
		await runPacklistTest(
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
		)
	})
})
