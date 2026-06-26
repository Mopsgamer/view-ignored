import { describe, test } from "bun:test"

import { makeNPM } from "../targets/npm.js"
import { testScan } from "../testScan.test.js"

describe.skipIf(!process.env.TEST_PACKLIST)("npm-packlist package-json-nested", () => {
	test("includes nested package.json file", async (done) => {
		await testScan(
			done,
			{
				nest: {
					"foo.js": 'console.log("no")',
					"index.js": 'console.log("hi")',
					"package.json": JSON.stringify({
						files: ["index.js"],
						name: "nested-package",
						version: "1.2.3",
					}),
				},
				"package.json": JSON.stringify({
					name: "test-package",
					version: "1.2.3",
				}),
			},
			["nest/foo.js", "nest/index.js", "nest/package.json", "package.json"],
			{ target: makeNPM() },
		)
	})
})
