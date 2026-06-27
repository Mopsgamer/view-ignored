import { describe, test } from "bun:test"

import { makeNPM } from "../targets/npm.js"
import { testScan } from "../testScan.test.js"

describe.skipIf(!process.env.TEST_PACKLIST)("npm-packlist bundled-cycle", () => {
	test("correctly bundles cyclic deps", async (done) => {
		await testScan(
			done,
			{
				"index.js": "",
				node_modules: {
					a: {
						"index.js": "",
						"package.json": JSON.stringify({
							dependencies: {
								b: "1.0.0",
							},
							main: "index.js",
							name: "a",
							version: "1.0.0",
						}),
					},
					b: {
						"index.js": "",
						"package.json": JSON.stringify({
							dependencies: {
								a: "1.0.0",
							},
							main: "index.js",
							name: "b",
							version: "1.0.0",
						}),
					},
				},
				"package.json": JSON.stringify({
					bundleDependencies: ["a"],
					dependencies: {
						a: "1.0.0",
					},
					main: "index.js",
					name: "root",
					version: "1.0.0",
				}),
			},
			[
				"index.js",
				"node_modules/a/index.js",
				"node_modules/b/index.js",
				"node_modules/a/package.json",
				"node_modules/b/package.json",
				"package.json",
			],
			{ target: makeNPM(), dirs: false },
		)
	})
})
