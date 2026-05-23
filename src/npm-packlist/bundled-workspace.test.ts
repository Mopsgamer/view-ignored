/* eslint-disable sort-keys */
import { describe, test } from "bun:test"

import { runPacklistTest } from "./runPacklistTest.js"

describe("bundled-workspace", () => {
	// https://github.com/npm/npm-packlist/blob/79d3761d6ab491ceeb192e2b88d0853d57048768/test/bundled-workspace.js#L7
	test("packs workspace dependencies correctly", () =>
		runPacklistTest(
			{
				"package.json": JSON.stringify({
					name: "root",
					version: "1.2.3",
					main: "index.js",
					files: ["index.js"],
					dependencies: {
						foo: "1.0.0",
						bar: "1.0.0",
					},
					bundleDependencies: ["foo", "bar"],
					workspaces: ["./workspaces/*"],
				}),
				"index.js": "",
				workspaces: {
					foo: {
						"package.json": JSON.stringify({
							name: "foo",
							version: "1.0.0",
							main: "index.js",
						}),
						"index.js": "",
					},
					bar: {
						"package.json": JSON.stringify({
							name: "bar",
							version: "1.0.0",
							main: "index.js",
						}),
						"index.js": "",
					},
				},
				node_modules: {
					foo: { isSymlink: true, path: "../workspaces/foo" },
					bar: { isSymlink: true, path: "../workspaces/bar" },
				},
			},
			[
				"index.js",
				"node_modules/bar/index.js",
				"node_modules/foo/index.js",
				"node_modules/bar/package.json",
				"node_modules/foo/package.json",
				"package.json",
			],
			{},
		))
})
