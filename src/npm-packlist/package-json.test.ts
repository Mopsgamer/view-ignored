/* eslint-disable sort-keys */
import { describe, test } from "bun:test"

import { elfJS } from "../test-utils.js"
import { runPacklistTest } from "./runPacklistTest.js"

describe("package-json", () => {
	// https://github.com/npm/npm-packlist/blob/79d3761d6ab491ceeb192e2b88d0853d57048768/test/package-json.js#L45
	test("follows npm package ignoring rules", () =>
		runPacklistTest(
			{
				"package.json": JSON.stringify({
					name: "test-package",
					version: "3.1.4",
					files: ["elf.js", "deps/foo/config/config.gypi"],
				}),
				"npm-shrinkwrap.json": JSON.stringify({ shrink: "wrap" }),
				"elf.js": elfJS,
				".npmrc": "packaged=false",
				// don't bother even reading this file, because we have files list
				".npmignore": "!.npmignore\n!dummy\npackage.json",
				dummy: "foo",
				build: {
					"config.gypi": "i_wont_be_included='with any luck'",
					"npm-debug.log": "0 lol\n",
				},
				deps: {
					foo: {
						config: {
							"config.gypi": "i_will_be_included='with any luck'",
						},
					},
				},
				".git": {
					gitstub: "won't fool git, also won't be included",
				},
				node_modules: {
					history: {
						"README.md": "please don't include me",
					},
				},
			},
			["deps/foo/config/config.gypi", "elf.js", "package.json"],
			{},
		))
})
