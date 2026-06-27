import { describe, test } from "bun:test"

import { makeNPM } from "../targets/npm.js"
import { testScan } from "../testScan.test.js"

describe.skipIf(!process.env.TEST_PACKLIST)("npm-packlist package-json-main", () => {
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
				".npmignore": "!.npmignore\n!dummy\npackage.json",
				".npmrc": "packaged=false",
				"__main.js": elfJS,
				"browser.js": elfJS,
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
				"package.json": JSON.stringify({
					browser: "browser.js",
					files: ["elf.js", "deps/foo/config/config.gypi"],
					main: "__main.js",
					name: "test-package",
					version: "3.1.4",
				}),
			},
			["deps/foo/config/config.gypi", "__main.js", "browser.js", "elf.js", "package.json"],
			{ target: makeNPM(), dirs: false },
		)
	})
})
