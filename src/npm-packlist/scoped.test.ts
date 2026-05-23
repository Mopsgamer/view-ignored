import { describe, test } from "bun:test"

import { elfJS } from "../test-utils.js"
import { runPacklistTest } from "./runPacklistTest.js"

describe("scoped", () => {
	test("includes bundledDependencies", async () => {
		await runPacklistTest(
			{
				"package.json": JSON.stringify({
					name: "test-package-scoped",
					version: "3.1.4",
					main: "elf.js",
					dependencies: {
						"@npmwombat/scoped": "1.0.0",
					},
					bundledDependencies: ["@npmwombat/scoped"],
				}),
				"elf.js": elfJS,
				node_modules: {
					"@npmwombat": {
						scoped: {
							"index.js": "console.log('hello wombat')",
						},
						no: {
							"wombat.js": "console.log('no bundle please')",
						},
					},
					"@ignore": {
						scoped: {
							"index.js": "console.log('i do not want to be bundled')",
						},
					},
				},
			},
			["elf.js", "node_modules/@npmwombat/scoped/index.js", "package.json"],
			{},
		)
	})
})
