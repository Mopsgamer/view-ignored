import { describe, test } from "bun:test"

import { elfJS } from "../test-utils.js"
import { runPacklistTest } from "./runPacklistTest.js"

describe("bundled-scoped", () => {
	test("includes bundled dependency", async () => {
		await runPacklistTest(
			{
				"package.json": JSON.stringify({
					name: "test-package",
					version: "3.1.4",
					main: "elf.js",
					dependencies: {
						"@npmwombat/history": "1.0.0",
					},
					bundleDependencies: ["@npmwombat/history"],
				}),
				"elf.js": elfJS,
				".npmrc": "packaged=false",
				node_modules: {
					"@npmwombat": {
						history: {
							"package.json": JSON.stringify({
								name: "@npmwombat/history",
								version: "1.0.0",
								main: "index.js",
							}),
							"index.js": elfJS,
						},
					},
				},
			},
			[
				"elf.js",
				"node_modules/@npmwombat/history/index.js",
				"node_modules/@npmwombat/history/package.json",
				"package.json",
			],
			{},
		)
	})
})
