/* eslint-disable sort-keys */
import { describe, test } from "bun:test"

import { elfJS } from "../test-utils.js"
import { runPacklistTest } from "./runPacklistTest.js"

describe("symlink", () => {
	// https://github.com/npm/npm-packlist/blob/79d3761d6ab491ceeb192e2b88d0853d57048768/test/symlink.js#L64
	test("follows npm package ignoring rules", () =>
		runPacklistTest(
			{
				"package.json": JSON.stringify({
					name: "test-package",
					version: "3.1.4",
					main: "elf.js",
				}),
				"elf.js": elfJS,
				"link.js": { isSymlink: true, path: "elf.js" },
				".npmrc": "packaged=false",
				".npmignore": ".npmignore\ndummy\n/package.json\n",
				// empty dir should be ignored
				this: { dir: { is: { empty: { and: { ignored: {} } } } } },
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

				// ljharb's monorepo test goober that blew up
				test: {
					resolver: {
						multirepo: {
							packages: {
								a: {
									README: "included",
									node_modules: {
										some_dep: {
											"package.json": JSON.stringify({ version: "1.2.3" }),
										},
										"@scope": {
											b: { isSymlink: true, path: "../../../b" },
										},
									},
								},
								b: {
									"index.js": 'console.log("woop")',
									node_modules: {
										a: { isSymlink: true, path: "../../a" },
									},
								},
							},
						},
					},
				},
			},
			[
				"test/resolver/multirepo/packages/a/README",
				"deps/foo/config/config.gypi",
				"elf.js",
				"test/resolver/multirepo/packages/b/index.js",
				"package.json",
				"test/resolver/multirepo/packages/a/node_modules/some_dep/package.json",
			],
			{},
		))
})
