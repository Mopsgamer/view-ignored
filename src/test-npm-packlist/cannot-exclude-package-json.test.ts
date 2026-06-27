import { describe, test } from "bun:test"

import { makeNPM } from "../targets/npm.js"
import { testScan } from "../testScan.test.js"

describe.skipIf(!process.env.TEST_PACKLIST)("npm-packlist cannot-exclude-package-json", () => {
	test("try to exclude package.json but cannot", async (done) => {
		await testScan(
			done,
			{
				".npmignore": "package.json",
				"package.json": JSON.stringify({
					files: [".npmignore", "!package.json"],
					name: "test-package",
					version: "1.0.0",
				}),
			},
			[".npmignore", "package.json"],
			{ target: makeNPM(), dirs: false },
		)
	})
})
