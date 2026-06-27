import { describe, test } from "bun:test"

import { makeNPM } from "../targets/npm.js"
import { testScan } from "../testScan.test.js"

describe.skipIf(!process.env.TEST_PACKLIST)("npm-packlist package-not-json", () => {
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
				".npmignore": ".npmignore\ndummy\npackage.json\n",
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
				node_modules: {
					history: {
						"README.md": "please don't include me",
					},
				},
				"package.json": "c'est ne pas une j'son",
			},
			["deps/foo/config/config.gypi", "elf.js", "package.json"],
			{ target: makeNPM(), dirs: false },
		)
	})
})
