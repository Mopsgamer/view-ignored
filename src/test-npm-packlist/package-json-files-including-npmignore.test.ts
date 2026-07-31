// Original test case verifying npm-packlist behavior for package-json-files-including-npmignore.
// https://github.com/npm/npm-packlist/blob/d1eed617b1ff1eedf5909efec7867aee385d0350/test/package-json-files-including-npmignore.js

import { describe, test } from "bun:test"

import { makeNPM } from "../targets/npm.js"
import { testScan } from "../testScan.test.js"

describe.skipIf(!process.env.TEST_PACKLIST)(
	"npm-packlist package-json-files-including-npmignore",
	() => {
		test("package with negated files", async (done) => {
			await testScan(
				done,
				{
					lib: {
						".DS_Store": "a store of ds",
						".npmignore": "two.js",
						sub: {
							"for.js": "for",
							"one.js": "one",
							"tre.js": "tre",
							"two.js": "two",
						},
					},
					"package.json": JSON.stringify({
						files: ["lib/sub/*.js", "lib/.npmignore"],
						name: "test-package",
						version: "1.0.0",
					}),
				},
				["lib/sub/for.js", "lib/sub/one.js", "lib/sub/tre.js", "package.json"],
				{ target: makeNPM(), dirs: false },
			)
		})
	},
)
