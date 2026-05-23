/* eslint-disable sort-keys */
import { describe, test } from "bun:test"

import { elfJS } from "../test-utils.js"
import { runPacklistTest } from "./runPacklistTest.js"

describe("empty-npmignore", () => {
	// https://github.com/npm/npm-packlist/blob/79d3761d6ab491ceeb192e2b88d0853d57048768/test/empty-npmignore.js#L47
	test("follows npm package ignoring rules", () =>
		runPacklistTest(
			{
				"package.json": JSON.stringify({
					name: "test-package",
					version: "3.1.4",
					main: "elf.js",
				}),
				"elf.js": elfJS,
				".gitignore": "*",
				".npmignore": "",
				lib: {
					node_modules: {
						foo: {
							"package.json": '{"name":"just a test","version":"bugbear"}',
						},
					},
				},
				".npmrc": "packaged=false",
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
			[
				"deps/foo/config/config.gypi",
				"elf.js",
				"lib/node_modules/foo/package.json",
				"package.json",
			],
			{},
		))
})
