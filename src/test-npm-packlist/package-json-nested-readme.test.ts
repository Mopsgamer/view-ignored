// Original test case verifying npm-packlist behavior for package-json-nested-readme.
// https://github.com/npm/npm-packlist/blob/d1eed617b1ff1eedf5909efec7867aee385d0350/test/package-json-nested-readme.js

import { describe, test } from "bun:test"

import { makeNPM } from "../targets/npm.js"
import { testScan } from "../testScan.test.js"

describe.skipIf(process.env.TEST_PACKLIST == "0")("npm-packlist package-json-nested-readme", () => {
	test("include readme.* files anywhere in a package", async (done) => {
		await testScan(
			done,
			{
				".npmignore": "\n  !*.js\n  !**/*.js\n  test\n  ",
				lib: {
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
			[
				"lib/a/a.js",
				"lib/a/b/b.js",
				"lib/a/b/c/c.js",
				"package.json",
				"lib/a/b/c/readme.md",
				"lib/a/b/readme.md",
				"lib/a/readme.md",
				"lib/a/b/c/file.txt",
				"lib/a/b/file.txt",
				"lib/a/file.txt",
			],
			{ target: makeNPM(), dirs: false },
		)
	})
})
