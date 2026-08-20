// Original test case verifying npm-packlist behavior for cannot-include-package-lock.
// https://github.com/npm/npm-packlist/blob/d1eed617b1ff1eedf5909efec7867aee385d0350/test/cannot-include-package-lock.js

import { describe, test } from "bun:test"

import { makeNPM } from "../targets/npm.js"
import { testScan } from "../testScan.test.js"

describe.skipIf(process.env.TEST_PACKLIST == "0")(
	"npm-packlist cannot-include-package-lock",
	() => {
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
	},
)
