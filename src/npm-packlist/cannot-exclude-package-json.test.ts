import { describe, test } from "bun:test"

import { runPacklistTest } from "./runPacklistTest.js"

describe("cannot-exclude-package-json", () => {
	test("try to exclude package.json but cannot", async () => {
		await runPacklistTest(
			{
				"package.json": JSON.stringify({
					files: [".npmignore", "!package.json"],
				}),
				".npmignore": "package.json",
			},
			[".npmignore", "package.json"],
			{},
		)
	})
})
