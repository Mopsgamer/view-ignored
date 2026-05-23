/* eslint-disable sort-keys */
import { describe, test } from "bun:test"

import { elfJS } from "../test-utils.js"
import { runPacklistTest } from "./runPacklistTest.js"

describe("bundled-files", () => {
	// https://github.com/npm/npm-packlist/blob/79d3761d6ab491ceeb192e2b88d0853d57048768/test/bundled-files.js#L9
	test("includes bundled dependency using bundleDependencies", () =>
		runPacklistTest(
			{
				"package.json": JSON.stringify({
					name: "test-package",
					version: "3.1.4",
					main: "elf.js",
					dependencies: {
						history: "1.0.0",
					},
					bundleDependencies: ["history"],
					files: ["elf.js"],
				}),
				"elf.js": elfJS,
				".npmrc": "packaged=false",
				node_modules: {
					history: {
						"package.json": JSON.stringify({
							name: "history",
							version: "1.0.0",
							main: "index.js",
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
		))
	// https://github.com/npm/npm-packlist/blob/79d3761d6ab491ceeb192e2b88d0853d57048768/test/bundled-files.js#L48
	test("includes bundled dependency using bundledDependencies", () =>
		runPacklistTest(
			{
				"package.json": JSON.stringify({
					name: "test-package",
					version: "3.1.4",
					main: "elf.js",
					dependencies: {
						history: "1.0.0",
					},
					bundledDependencies: ["history"],
					files: ["elf.js"],
				}),
				"elf.js": elfJS,
				".npmrc": "packaged=false",
				node_modules: {
					history: {
						"package.json": JSON.stringify({
							name: "history",
							version: "1.0.0",
							main: "index.js",
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
		))
})
