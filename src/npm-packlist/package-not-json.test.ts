import { describe, test } from "bun:test"

import { elfJS } from "../test-utils.js"
import { runPacklistTest } from "./runPacklistTest.js"

describe("package-not-json", () => {
	test("follows npm package ignoring rules", async () => {
		await runPacklistTest(
			{
				"package.json": "c'est ne pas une j'son",
				"elf.js": elfJS,
				".npmrc": "packaged=false",
				".npmignore": ".npmignore\ndummy\npackage.json\n",
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
			{},
		)
	})
})
