import { describe, test } from "bun:test"

import { makeNPM } from "../targets/npm.js"
import { testScan } from "../testScan.test.js"

describe.skipIf(!process.env.TEST_PACKLIST)("npm-packlist bundled-file-in-workspace", () => {
	test("correctly filters files from workspace subdirectory", async (done) => {
		await testScan(
			done,
			{
				docs: {
					"bar.txt": "",
					"foo.txt": "",
					"package.json": JSON.stringify({
						files: ["*.txt"],
						main: "index.js",
						name: "docs",
						version: "1.0.0",
					}),
					"readme.md": "",
					test: {
						"index.js": "",
					},
				},
				"index.js": "",
				"package.json": JSON.stringify({
					files: ["docs/*.txt"],
					main: "index.js",
					name: "root",
					version: "1.0.0",
					workspaces: ["./docs"],
				}),
			},
			["index.js", "package.json", "docs/bar.txt", "docs/foo.txt"],
			{ target: makeNPM() },
		)
	})

	test("does not filter based on package.json if subdirectory is not a workspace", async (done) => {
		await testScan(
			done,
			{
				docs: {
					"bar.txt": "",
					"baz.txt": "",
					"foo.txt": "",
					"package.json": JSON.stringify({
						files: ["bar.txt", "foo.txt"],
						main: "index.js",
						name: "docs",
						version: "1.0.0",
					}),
					"readme.md": "",
					test: {
						"index.js": "",
					},
				},
				"index.js": "",
				"package.json": JSON.stringify({
					files: ["docs/*.txt"],
					main: "index.js",
					name: "root",
					version: "1.0.0",
					// this test needs a workspace to exist, but that workspace cannot be the one we include files from
					workspaces: ["./unrelated"],
				}),
				unrelated: {
					"index.js": "",
					"package.json": JSON.stringify({
						main: "index.js",
						name: "unrelated",
						version: "1.0.0",
					}),
				},
			},
			["index.js", "package.json", "docs/bar.txt", "docs/baz.txt", "docs/foo.txt"],
			{ target: makeNPM() },
		)
	})
})
