/* eslint-disable sort-keys */
import { describe, test } from "bun:test"

import { runPacklistTest } from "./runPacklistTest.js"

describe("package-json-negate-non-root", () => {
	// https://github.com/npm/npm-packlist/blob/79d3761d6ab491ceeb192e2b88d0853d57048768/test/package-json-negate-non-root.js#L57
	test("package with negated readme, licence and license files", () =>
		runPacklistTest(
			{
				"package.json": JSON.stringify({
					files: ["lib", "!**/readme.md", "!**/licence", "!**/license", "!**/copying"],
				}),
				"readme.md": "one",
				licence: "two",
				license: "tre",
				copying: "for",
				lib: {
					"readme.md": "one",
					licence: "two",
					license: "tre",
					copying: "for",
					a: {
						"readme.md": "one",
						licence: "two",
						license: "tre",
						copying: "for",
						b: {
							"readme.md": "one",
							licence: "two",
							license: "tre",
							copying: "for",
							c: {
								"readme.md": "one",
								licence: "two",
								license: "tre",
								copying: "for",
								"file.txt": "one",
								"c.js": "two",
							},
							"file.txt": "one",
							"b.js": "two",
						},
						"file.txt": "one",
						"a.js": "two",
					},
				},
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
			{},
		))
})
