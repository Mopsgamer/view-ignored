import { describe, test } from "bun:test"
import { runPacklistTest } from "./runPacklistTest.js"

describe("npm-packlist batch 2 (package.json files field)", () => {
	test("package-json-files-and-containing-dir.js", async () => {
		await runPacklistTest(
			{
				"package.json": JSON.stringify({
					files: ["lib/a.js", "lib"],
				}),
				lib: {
					"a.js": "",
					"b.js": "",
				},
			},
			["lib/a.js", "lib/b.js", "package.json"],
		)
	})

	test("package-json-files-dir-and-nested-ignore.js", async () => {
		await runPacklistTest(
			{
				"package.json": JSON.stringify({
					files: ["lib"],
				}),
				lib: {
					".npmignore": "b.js",
					"a.js": "",
					"b.js": "",
				},
			},
			["lib/a.js", "package.json"],
		)
	})

	test("package-json-files-including-npmignore.js", async () => {
		await runPacklistTest(
			{
				"package.json": JSON.stringify({
					files: [".npmignore"],
				}),
				".npmignore": "a.js",
				"a.js": "",
				"b.js": "",
			},
			[".npmignore", "b.js", "package.json"],
		)
	})
})
