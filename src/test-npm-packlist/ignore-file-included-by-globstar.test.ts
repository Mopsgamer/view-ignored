import { describe, test } from "bun:test"

import { makeNPM } from "../targets/npm.js"
import { testScan } from "../testScan.test.js"

describe.skipIf(!process.env.TEST_PACKLIST)("npm-packlist ignore-file-included-by-globstar", () => {
	test("exclude certain files always", async (done) => {
		await testScan(
			done,
			{
				".git": {
					HEAD: "empty",
				},
				".npmrc": "secrets=true",
				"glorp.txt": "",
				"index.js": "",
				node_modules: {
					foo: {
						"index.js": "",
					},
				},
				"package-lock.json": "{}",
				"package.json": JSON.stringify({
					files: ["*"],
					name: "@npmcli/globstar-test",
					version: "1.0.0",
				}),
				"pnpm-lock.yaml": "{}",
				subdir: {
					".npmrc": "sneaky=true",
					"index.js": "",
					"other.js": "",
				},
				"yarn.lock": "{}",
			},
			["index.js", "subdir/other.js", "package.json", "glorp.txt"],
			{ target: makeNPM() },
		)
	})

	test("include a globstar, then exclude one of them", async (done) => {
		await testScan(
			done,
			{
				bar: {
					"bar.js": "",
				},
				"bar.js": "",
				"glorp.txt": "",
				"package.json": JSON.stringify({
					files: ["**/*.js", "!foo.js"],
					name: "cli-issue-2009",
					version: "1.0.0",
				}),
			},
			["bar.js", "bar/bar.js", "package.json"],
			{ target: makeNPM() },
		)
	})
})
