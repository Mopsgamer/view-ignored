import { describe, test } from "bun:test"

import { makeNPM } from "../targets/npm.js"
import { testScan } from "../testScan.test.js"

const elfJS = `
module.exports = elf =>
  console.log("i'm a elf")
`

describe.skipIf(!process.env.TEST_PACKLIST)("npm-packlist package-json-empty", () => {
	test("follows npm package ignoring rules with empty files list", async (done) => {
		await testScan(
			done,
			{
				".git": {
					gitstub: "won't fool git, also won't be included",
				},
				".npmignore": "!.npmignore\n!dummy\npackage.json\n!index.js\n",
				".npmrc": "packaged=false",
				build: {
					"config.gypi": "i_wont_be_included='with any luck'",
					"npm-debug.log": "0 lol\n",
				},
				deps: {
					foo: {
						config: {
							"config.gypi": "i_wont_be_included='with any luck'",
						},
					},
				},
				dummy: "foo",
				"elf.js": elfJS,
				"index.js": elfJS,
				node_modules: {
					history: {
						"README.md": "please don't include me",
					},
				},
				"package.json": JSON.stringify({
					files: [],
					main: "elf.js",
					name: "test-package",
					version: "3.1.4",
				}),
			},
			["elf.js", "package.json"],
			{ target: makeNPM(), dirs: false },
		)
	})
})
