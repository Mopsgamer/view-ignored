import { describe, test } from "bun:test"

import { makeNPM } from "../targets/npm.js"
import { testScan } from "../testScan.test.js"

const elfJS = `
module.exports = elf =>
  console.log("i'm a elf")
`

describe.skipIf(!process.env.TEST_PACKLIST)("npm-packlist symlink", () => {
	test("follows npm package ignoring rules", async (done) => {
		await testScan(
			done,
			{
				".git": {
					gitstub: "won't fool git, also won't be included",
				},
				".npmignore": ".npmignore\ndummy\n/package.json\n",
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
				"package.json": JSON.stringify({
					main: "elf.js",
					name: "test-package",
					version: "3.1.4",
				}),
				test: {
					resolver: {
						multirepo: {
							packages: {
								a: {
									README: "included",
									node_modules: {
										"@scope": {},
										some_dep: {
											"package.json": JSON.stringify({
												name: "some_dep",
												version: "1.2.3",
											}),
										},
									},
								},
								b: {
									"index.js": 'console.log("woop")',
									node_modules: {},
								},
							},
						},
					},
				},
				this: { dir: { is: { empty: { and: { ignored: {} } } } } },
			},
			[
				"test/resolver/multirepo/packages/a/README",
				"deps/foo/config/config.gypi",
				"elf.js",
				"test/resolver/multirepo/packages/b/index.js",
				"package.json",
				"test/resolver/multirepo/packages/a/node_modules/some_dep/package.json",
			],
			{ target: makeNPM() },
			{
				"link.js": "elf.js",
				"test/resolver/multirepo/packages/a/node_modules/@scope/b": "../../../b",
				"test/resolver/multirepo/packages/b/node_modules/a": "../../a",
			},
		)
	})
})
