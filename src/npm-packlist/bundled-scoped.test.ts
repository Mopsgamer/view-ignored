/* eslint-disable sort-keys */
import { describe, test } from "bun:test"

import { elfJS } from "../test-utils.js"
import { runPacklistTest } from "./runPacklistTest.js"

describe("bundled-scoped", () => {
	// https://github.com/npm/npm-packlist/blob/79d3761d6ab491ceeb192e2b88d0853d57048768/test/bundled-scoped.js#L37
	test("includes bundled dependency", () =>
		runPacklistTest(
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
		))
})
