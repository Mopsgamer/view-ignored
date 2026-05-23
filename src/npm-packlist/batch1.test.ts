import { describe, test } from "bun:test"
import { runPacklistTest } from "./runPacklistTest.js"

describe("npm-packlist batch 1", () => {
	test("package-json.js", async () => {
		await runPacklistTest(
			{
				"package.json": JSON.stringify({
					name: "test-package",
					version: "3.1.4",
					files: ["elf.js", "deps/foo/config/config.gypi"],
				}),
				"npm-shrinkwrap.json": JSON.stringify({ shrink: "wrap" }),
				"elf.js": "console.log(\"i'm a elf\")",
				".npmrc": "packaged=false",
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
		)
	})

	test("ignores.js", async () => {
		await runPacklistTest(
			{
				"package.json": JSON.stringify({
					name: "test-package",
					version: "3.1.4",
					main: "elf.js",
				}),
				"archived-packages": {
					ignoreme: "this should be ignored",
				},
				"elf.js": "console.log(\"i'm a elf\")",
				".npmrc": "packaged=false",
				".npmignore": "\n.npmignore\ndummy\npackage.json\n!**/non.existent\nreadme.md\n*~\n",
				dummy: "foo",
				core: "foo",
				".DS_Store": {
					foo: "foo",
				},
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
					".git": "do not include me",
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
				node_modules: {
					history: {
						"README.md": "please don't include me",
					},
				},
			},
			["core", "deps/foo/config/config.gypi", "elf.js", "package.json", "readme.md"],
		)
	})

	test("package-json-main.js", async () => {
		await runPacklistTest(
			{
				"package.json": JSON.stringify({
					name: "test-package",
					version: "3.1.4",
					main: "__main.js",
					browser: "browser.js",
					files: ["elf.js", "deps/foo/config/config.gypi"],
				}),
				"elf.js": "console.log(\"i'm a elf\")",
				"__main.js": "console.log(\"i'm a elf\")",
				"browser.js": "console.log(\"i'm a elf\")",
				".npmrc": "packaged=false",
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
			["deps/foo/config/config.gypi", "__main.js", "browser.js", "elf.js", "package.json"],
		)
	})

	test("empty-npmignore.js", async () => {
		await runPacklistTest(
			{
				"package.json": JSON.stringify({
					name: "test-package",
					version: "3.1.4",
					main: "elf.js",
				}),
				"elf.js": "console.log(\"i'm a elf\")",
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
			["deps/foo/config/config.gypi", "elf.js", "lib/node_modules/foo/package.json", "package.json"],
		)
	})
})
