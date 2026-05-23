import { describe, test } from "bun:test"

import { elfJS } from "../test-utils.js"
import { runPacklistTest } from "./runPacklistTest.js"

describe("bundled-missing-optional", () => {
	test("includes bundled dependency using bundleDependencies", async () => {
		await runPacklistTest(
			{
				"package.json": JSON.stringify({
					name: "test-package",
					version: "3.1.4",
					main: "elf.js",
					dependencies: {
						history: "1.0.0",
					},
					bundleDependencies: ["history"],
				}),
				"elf.js": elfJS,
				".npmrc": "packaged=false",
				node_modules: {
					history: {
						"package.json": JSON.stringify({
							name: "history",
							version: "1.0.0",
							main: "index.js",
							optionalDependencies: {
								// defined here, but not installed
								optionalDep: "^1.0.0",
							},
						}),
						"index.js": elfJS,
					},
				},
			},
			[
				"elf.js",
				"node_modules/history/index.js",
				"node_modules/history/package.json",
				"package.json",
			],
			{},
		)
	})
})
