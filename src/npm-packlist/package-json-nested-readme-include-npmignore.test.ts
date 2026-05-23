/* eslint-disable sort-keys */
import { describe, test } from "bun:test"

import { runPacklistTest } from "./runPacklistTest.js"

describe("package-json-nested-readme-include-npmignore", () => {
	// https://github.com/npm/npm-packlist/blob/79d3761d6ab491ceeb192e2b88d0853d57048768/test/package-json-nested-readme-include-npmignore.js#L54
	test("package with negated files", () =>
		runPacklistTest(
			{
				"package.json": JSON.stringify({
					files: [".npmignore", "lib"],
				}),
				lib: {
					".npmignore": `
    *
    !*.js
    !**/*.js
    test
    `,
					a: {
						b: {
							c: {
								"readme.md": "one",
								"file.txt": "one",
								"c.js": "one",
							},
							"readme.md": "one",
							"file.txt": "one",
							"b.js": "one",
						},
						"readme.md": "one",
						"file.txt": "one",
						"a.js": "one",
					},
				},
				test: {
					a: {
						b: {
							c: {
								"readme.md": "one",
								"file.txt": "one",
								"c.js": "one",
							},
							"readme.md": "one",
							"file.txt": "one",
							"b.js": "one",
						},
						"readme.md": "one",
						"file.txt": "one",
						"a.js": "one",
					},
				},
			},
			["lib/a/a.js", "lib/a/b/b.js", "lib/a/b/c/c.js", "package.json"],
			{},
		))
})
