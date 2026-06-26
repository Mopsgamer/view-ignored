import { describe, test } from "bun:test"

import { makeNPM } from "../targets/npm.js"
import { testScan } from "../testScan.test.js"

describe.skipIf(!process.env.TEST_PACKLIST)("npm-packlist package-json-negate-non-root", () => {
	test("package with negated readme, licence and license files", async (done) => {
		await testScan(
			done,
			{
				copying: "for",
				lib: {
					a: {
						"a.js": "two",
						b: {
							"b.js": "two",
							c: {
								"c.js": "two",
								copying: "for",
								"file.txt": "one",
								licence: "two",
								license: "tre",
								"readme.md": "one",
							},
							copying: "for",
							"file.txt": "one",
							licence: "two",
							license: "tre",
							"readme.md": "one",
						},
						copying: "for",
						"file.txt": "one",
						licence: "two",
						license: "tre",
						"readme.md": "one",
					},
					copying: "for",
					licence: "two",
					license: "tre",
					"readme.md": "one",
				},
				licence: "two",
				license: "tre",
				"package.json": JSON.stringify({
					files: ["lib", "!**/readme.md", "!**/licence", "!**/license", "!**/copying"],
					name: "test-package",
					version: "1.0.0",
				}),
				"readme.md": "one",
			},
			[
				"copying",
				"licence",
				"license",
				"lib/a/a.js",
				"lib/a/b/b.js",
				"lib/a/b/c/c.js",
				"package.json",
				"readme.md",
				"lib/a/b/c/file.txt",
				"lib/a/b/file.txt",
				"lib/a/file.txt",
			],
			{ target: makeNPM() },
		)
	})
})
