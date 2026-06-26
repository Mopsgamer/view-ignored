import { describe, test } from "bun:test"

import { makeNPM } from "../targets/npm.js"
import { testScan } from "../testScan.test.js"

describe.skipIf(!process.env.TEST_PACKLIST)("npm-packlist bundled-workspace", () => {
	test("includes bundled dependency that is also a workspace", async (done) => {
		await testScan(
			done,
			{
				"package.json": JSON.stringify({
					bundleDependencies: ["foo", "bar"],
					dependencies: {
						bar: "1.0.0",
						foo: "1.0.0",
					},
					name: "root",
					version: "1.0.0",
					workspaces: ["workspaces/*"],
				}),
				node_modules: {},
				workspaces: {
					bar: {
						"index.js": "console.log('bar')",
						"package.json": JSON.stringify({
							name: "bar",
							version: "1.0.0",
						}),
					},
					foo: {
						"index.js": "console.log('foo')",
						"package.json": JSON.stringify({
							name: "foo",
							version: "1.0.0",
						}),
					},
				},
			},
			[
				"node_modules/bar/index.js",
				"node_modules/bar/package.json",
				"node_modules/foo/index.js",
				"node_modules/foo/package.json",
				"package.json",
			],
			{ target: makeNPM() },
			{
				"node_modules/bar": "../workspaces/bar",
				"node_modules/foo": "../workspaces/foo",
			},
		)
	})
})
