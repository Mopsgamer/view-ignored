// Original test case verifying npm-packlist behavior for bundle-missing-dep.
// https://github.com/npm/npm-packlist/blob/d1eed617b1ff1eedf5909efec7867aee385d0350/test/bundle-missing-dep.js

import { describe, test } from "bun:test"

import { makeNPM } from "../targets/npm.js"
import { testScan } from "../testScan.test.js"

describe.skipIf(!process.env.TEST_PACKLIST)("npm-packlist bundle-missing-dep", () => {
	test("skips bundling deps with missing edges", async (done) => {
		await testScan(
			done,
			{
				"index.js": "",
				node_modules: {
					history: {
						"index.js": "",
						"package.json": JSON.stringify({
							main: "index.js",
							name: "history",
							version: "1.0.0",
						}),
					},
				},
				"package.json": JSON.stringify({
					bundleDependencies: ["history"],
					main: "index.js",
					name: "test",
					version: "1.0.0",
				}),
			},
			["index.js", "package.json"],
			{ target: makeNPM(), dirs: false },
		)
	})
})
