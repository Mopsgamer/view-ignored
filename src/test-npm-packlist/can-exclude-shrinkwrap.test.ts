// Original test case verifying npm-packlist behavior for can-exclude-shrinkwrap.
// https://github.com/npm/npm-packlist/blob/d1eed617b1ff1eedf5909efec7867aee385d0350/test/can-exclude-shrinkwrap.js

import { describe, test } from "bun:test"

import { makeNPM } from "../targets/npm.js"
import { testScan } from "../testScan.test.js"

describe.skipIf(!process.env.TEST_PACKLIST)("npm-packlist can-exclude-shrinkwrap", () => {
	test("package with negated files", async (done) => {
		await testScan(
			done,
			{
				".npmignore": "npm-shrinkwrap.json",
				"npm-shrinkwrap.json": "{}",
				"package.json": JSON.stringify({
					files: [".npmignore", "!npm-shrinkwrap.json"],
					name: "test-package",
					version: "1.0.0",
				}),
			},
			[".npmignore", "package.json"],
			{ target: makeNPM(), dirs: false },
		)
	})
})
