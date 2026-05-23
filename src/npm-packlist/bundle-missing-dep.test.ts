/* eslint-disable sort-keys */
import { describe, test } from "bun:test"

import { runPacklistTest } from "./runPacklistTest.js"

describe("bundle-missing-dep", () => {
	// https://github.com/npm/npm-packlist/blob/79d3761d6ab491ceeb192e2b88d0853d57048768/test/bundle-missing-dep.js#L7
	test("skips bundling deps with missing edges", () =>
		runPacklistTest(
			{
				"package.json": JSON.stringify({
					name: "test",
					version: "1.0.0",
					main: "index.js",
					// named in bundleDependencies, but not actually a dependency
					bundleDependencies: ["history"],
				}),
				"index.js": "",
				node_modules: {
					history: {
						"package.json": JSON.stringify({
							name: "history",
							version: "1.0.0",
							main: "index.js",
						}),
						"index.js": "",
					},
				},
			},
			["index.js", "package.json"],
			{},
		))
})
