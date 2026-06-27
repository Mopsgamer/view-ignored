import { describe, test } from "bun:test"

import { makeNPM } from "../targets/npm.js"
import { testScan } from "../testScan.test.js"

const elfJS = `
module.exports = elf =>
  console.log("i'm a elf")
`

describe.skipIf(!process.env.TEST_PACKLIST)("npm-packlist ignores", () => {
	test("follows npm package ignoring rules", async (done) => {
		await testScan(
			done,
			{
				".DS_Store": {
					foo: "foo",
				},
				".git": {
					gitstub: "wont fool git, also wont be included",
					logs: {
						refs: {
							remotes: {
								name: {
									readme: "please donot include git dirs (or even walk them)",
								},
							},
						},
					},
				},
				".npmignore": `
.npmignore
dummy
package.json
!**/non.existent
readme.md
*~
`,
				".npmrc": "packaged=false",
				"archived-packages": {
					ignoreme: "this should be ignored",
				},
				build: {
					"config.gypi": "i_wont_be_included='with any luck'",
					"npm-debug.log": "0 lol\n",
				},
				core: "foo",
				deps: {
					".git": "do not include me",
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
					main: "elf.js",
					name: "test-package",
					version: "3.1.4",
				}),
				"readme.md": "Elf package readme included even if ignored",
				"readme.md~": "Editor backup file should not be auto-included",
				this: {
					dir: {
						is: {
							empty: {
								and: {
									ignored: {},
								},
							},
						},
					},
				},
			},
			["core", "deps/foo/config/config.gypi", "elf.js", "package.json", "readme.md"],
			{ target: makeNPM(), dirs: false },
		)
	})
})
