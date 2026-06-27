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
