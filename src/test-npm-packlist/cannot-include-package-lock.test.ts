import { describe, test } from "bun:test"

import { makeNPM } from "../targets/npm.js"
import { testScan } from "../testScan.test.js"

describe.skipIf(!process.env.TEST_PACKLIST)("npm-packlist cannot-include-package-lock", () => {
	test("try to include package-lock.json but cannot", async (done) => {
		await testScan(
			done,
			{
				".npmignore": "\n!package-lock.json\n",
				"package-lock.json": "{}",
				"package.json": JSON.stringify({
					files: [".npmignore", "package-lock.json"],
					name: "test-package",
					version: "1.0.0",
				}),
			},
			[".npmignore", "package.json"],
			{ target: makeNPM(), dirs: false },
		)
	})
})
