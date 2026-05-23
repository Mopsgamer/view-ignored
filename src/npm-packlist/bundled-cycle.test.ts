/* eslint-disable sort-keys */
import { describe, test } from "bun:test"

import { runPacklistTest } from "./runPacklistTest.js"

describe("bundled-cycle", () => {
	// https://github.com/npm/npm-packlist/blob/79d3761d6ab491ceeb192e2b88d0853d57048768/test/bundled-cycle.js#L7
	test("correctly bundles cyclic deps", () =>
		runPacklistTest(
			{
				"package.json": JSON.stringify({
					name: "root",
					version: "1.0.0",
					main: "index.js",
					dependencies: {
						a: "1.0.0",
					},
					bundleDependencies: ["a"],
				}),
				"index.js": "",
				node_modules: {
					a: {
						"package.json": JSON.stringify({
							name: "a",
							version: "1.0.0",
							main: "index.js",
							dependencies: {
								b: "1.0.0",
							},
						}),
						"index.js": "",
					},
					b: {
						"package.json": JSON.stringify({
							name: "b",
							version: "1.0.0",
							main: "index.js",
							dependencies: {
								a: "1.0.0",
							},
						}),
						"index.js": "",
					},
				},
			},
			[
				"index.js",
				"node_modules/a/index.js",
				"node_modules/b/index.js",
				"node_modules/a/package.json",
				"node_modules/b/package.json",
				"package.json",
			],
			{},
		))
})
