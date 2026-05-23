/* eslint-disable sort-keys */
import { describe, test } from "bun:test"

import { runPacklistTest } from "./runPacklistTest.js"

describe("bundled-file-in-workspace", () => {
	// https://github.com/npm/npm-packlist/blob/79d3761d6ab491ceeb192e2b88d0853d57048768/test/bundled-file-in-workspace.js#L7
	test("correctly filters files from workspace subdirectory", () =>
		runPacklistTest(
			{
				"package.json": JSON.stringify({
					name: "root",
					version: "1.0.0",
					files: ["docs/*.txt"],
					main: "index.js",
					workspaces: ["./docs"],
				}),
				"index.js": "",
				docs: {
					"package.json": JSON.stringify({
						name: "docs",
						version: "1.0.0",
						main: "index.js",
						files: ["*.txt"],
					}),
					"bar.txt": "",
					"foo.txt": "",
					"readme.md": "",
					test: {
						"index.js": "",
					},
				},
			},
			["index.js", "package.json", "docs/bar.txt", "docs/foo.txt"],
			{},
		))
	// https://github.com/npm/npm-packlist/blob/79d3761d6ab491ceeb192e2b88d0853d57048768/test/bundled-file-in-workspace.js#L44
	test("does not filter based on package.json if subdirectory is not a workspace", () =>
		runPacklistTest(
			{
				"package.json": JSON.stringify({
					name: "root",
					version: "1.0.0",
					files: ["docs/*.txt"],
					main: "index.js",
					// this test needs a workspace to exist, but that workspace cannot be the one we include
					// files from
					workspaces: ["./unrelated"],
				}),
				"index.js": "",
				docs: {
					"package.json": JSON.stringify({
						name: "docs",
						version: "1.0.0",
						main: "index.js",
						files: ["bar.txt", "foo.txt"],
					}),
					"bar.txt": "",
					"baz.txt": "",
					"foo.txt": "",
					"readme.md": "",
					test: {
						"index.js": "",
					},
				},
				unrelated: {
					"package.json": JSON.stringify({
						name: "unrelated",
						version: "1.0.0",
						main: "index.js",
					}),
					"index.js": "",
				},
			},
			[
				"index.js",
				"package.json",
				"docs/bar.txt",
				"docs/baz.txt", // was _not_ filtered
				"docs/foo.txt",
			],
			{},
		))
})
