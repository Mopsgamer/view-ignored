// Original test case verifying npm-packlist behavior for cannot-exclude-readme.
// https://github.com/npm/npm-packlist/blob/d1eed617b1ff1eedf5909efec7867aee385d0350/test/cannot-exclude-readme.js

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
			{ target: makeNPM(), dirs: false },
		)
	})
})
