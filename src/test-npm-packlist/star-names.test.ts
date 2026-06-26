import { describe, test } from "bun:test"

import { makeNPM } from "../targets/npm.js"
import { testScan } from "../testScan.test.js"

describe.skipIf(!process.env.TEST_PACKLIST)("npm-packlist star-names", () => {
	test("follows npm package ignoring rules", async (done) => {
		const elfJS = `
module.exports = elf =>
  console.log("i'm a elf")
`
		await testScan(
			done,
			{
				".git": {
					gitstub: "won't fool git, also won't be included",
				},
				".npmignore": ".npmignore\ndummy\npackage.json",
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
				dummy: "foo",
				"elf.js": elfJS,
				"made*of*stars": "this file has a star in its name",
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
				this: { dir: { is: { empty: { and: { ignored: {} } } } } },
			},
			["deps/foo/config/config.gypi", "elf.js", "package.json"],
			{ target: makeNPM() },
		)
	})
})
