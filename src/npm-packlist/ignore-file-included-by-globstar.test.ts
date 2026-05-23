/* eslint-disable sort-keys */
import { describe, test } from "bun:test"

import { runPacklistTest } from "./runPacklistTest.js"

describe("ignore-file-included-by-globstar", () => {
	// https://github.com/npm/npm-packlist/blob/79d3761d6ab491ceeb192e2b88d0853d57048768/test/ignore-file-included-by-globstar.js#L7
	test("exclude certain files always", () =>
		runPacklistTest(
			{
				".npmrc": "secrets=true",
				".git": {
					HEAD: "empty",
				},
				node_modules: {
					foo: {
						"index.js": "",
					},
				},
				subdir: {
					"other.js": "",
					".npmrc": "sneaky=true",
				},
				"index.js": "",
				"glorp.txt": "",
				"package.json": JSON.stringify({
					name: "@npmcli/globstar-test",
					version: "1.0.0",
					files: ["*"],
				}),
				"package-lock.json": "{}",
				"yarn.lock": "{}",
				"pnpm-lock.yaml": "{}",
			},
			["index.js", "subdir/other.js", "package.json", "glorp.txt"],
			{},
		))
	// https://github.com/npm/npm-packlist/blob/79d3761d6ab491ceeb192e2b88d0853d57048768/test/ignore-file-included-by-globstar.js#L44
	test("include a globstar, then exclude one of them", () =>
		runPacklistTest(
			{
				"bar.js": "",
				bar: {
					"bar.js": "",
				},
				"glorp.txt": "",
				"package.json": JSON.stringify({
					name: "cli-issue-2009",
					version: "1.0.0",
					files: ["**/*.js", "!foo.js"],
				}),
			},
			["bar.js", "bar/bar.js", "package.json"],
			{},
		))
})
