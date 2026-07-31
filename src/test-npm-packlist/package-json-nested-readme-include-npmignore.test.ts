// Original test case verifying npm-packlist behavior for package-json-nested-readme-include-npmignore.
// https://github.com/npm/npm-packlist/blob/d1eed617b1ff1eedf5909efec7867aee385d0350/test/package-json-nested-readme-include-npmignore.js

import { describe, test } from "bun:test"

import { makeNPM } from "../targets/npm.js"
import { testScan } from "../testScan.test.js"

describe.skipIf(!process.env.TEST_PACKLIST)(
	"npm-packlist package-json-nested-readme-include-npmignore",
	() => {
		test("readme rules can be overridden by files array", async (done) => {
			await testScan(
				done,
				{
					lib: {
						".npmignore": "\n    *\n    !*.js\n    !**/*.js\n    test\n    ",
						a: {
							"a.js": "one",
							b: {
								"b.js": "one",
								c: {
									"c.js": "one",
									"file.txt": "one",
									"readme.md": "one",
								},
								"file.txt": "one",
								"readme.md": "one",
							},
							"file.txt": "one",
							"readme.md": "one",
						},
					},
					"package.json": JSON.stringify({
						files: [".npmignore", "lib"],
						name: "test-package",
						version: "1.0.0",
					}),
					test: {
						a: {
							"a.js": "one",
							b: {
								"b.js": "one",
								c: {
									"c.js": "one",
									"file.txt": "one",
									"readme.md": "one",
								},
								"file.txt": "one",
								"readme.md": "one",
							},
							"file.txt": "one",
							"readme.md": "one",
						},
					},
				},
				["lib/a/a.js", "lib/a/b/b.js", "lib/a/b/c/c.js", "package.json"],
				{ target: makeNPM(), dirs: false },
			)
		})
	},
)
