import { describe, test } from "bun:test"

import { makeNPM } from "../targets/npm.js"
import { testScan } from "../testScan.test.js"

describe.skipIf(!process.env.TEST_PACKLIST)("npm-packlist cannot-exclude-readme", () => {
	test("try to exclude package.json but cannot", async (done) => {
		await testScan(
			done,
			{
				".npmignore": "readme.md\nlicense.md\nhistory.md\n*.xyz",
				"changelog.xyz": "hello",
				"changes.md": "hello",
				"history.md": "hello",
				"license.md": "hello",
				"notice.md": "hello",
				"package.json": JSON.stringify({
					files: [".npmignore", "!readme.md"],
					name: "test-package",
					version: "1.0.0",
				}),
				"readme.md": "hello",
			},
			[".npmignore", "package.json", "license.md", "readme.md"],
			{ target: makeNPM() },
		)
	})
})
