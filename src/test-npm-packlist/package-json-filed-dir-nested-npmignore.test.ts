// Original test case verifying npm-packlist behavior for package-json-filed-dir-nested-npmignore.
// https://github.com/npm/npm-packlist/blob/d1eed617b1ff1eedf5909efec7867aee385d0350/test/package-json-filed-dir-nested-npmignore.js

import { describe, test } from "bun:test"

import { makeNPM } from "../targets/npm.js"
import { testScan } from "../testScan.test.js"

describe.skipIf(process.env.TEST_PACKLIST == "0")(
	"npm-packlist package-json-filed-dir-nested-npmignore",
	() => {
		test("package with negated files", async (done) => {
			await testScan(
				done,
				{
					lib: {
						".DS_Store": "a store of ds",
						".npmignore": "two.js",
						"for.js": "for",
						"one.js": "one",
						"tre.js": "tre",
						"two.js": "two",
					},
					"package.json": JSON.stringify({
						files: ["lib"],
						name: "test-package",
						version: "1.0.0",
					}),
				},
				["lib/for.js", "lib/one.js", "lib/tre.js", "package.json"],
				{ target: makeNPM(), dirs: false },
			)
		})
	},
)
