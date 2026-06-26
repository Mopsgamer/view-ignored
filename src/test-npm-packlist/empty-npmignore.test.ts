import { describe, test } from "bun:test"

import { makeNPM } from "../targets/npm.js"
import { testScan } from "../testScan.test.js"

const elfJS = `
module.exports = elf =>
  console.log("i'm a elf")
`

describe.skipIf(!process.env.TEST_PACKLIST)("npm-packlist empty-npmignore", () => {
	test("follows npm package ignoring rules", async (done) => {
		await testScan(
			done,
			{
				".git": {
					gitstub: "won't fool git, also won't be included",
				},
				".gitignore": "*",
				".npmignore": "",
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
				"elf.js": elfJS,
				lib: {
					node_modules: {
						foo: {
							"package.json": '{"name":"just a test","version":"bugbear"}',
						},
					},
				},
				node_modules: {
					history: {
						"README.md": "please don't include me",
					},
				},
				"package.json": JSON.stringify({
					main: "elf.js",
					name: "test-package",
					version: "3.1.4",
				}),
			},
			[
				"deps/foo/config/config.gypi",
				"elf.js",
				"lib/node_modules/foo/package.json",
				"package.json",
			],
			{ target: makeNPM() },
		)
	})
})
