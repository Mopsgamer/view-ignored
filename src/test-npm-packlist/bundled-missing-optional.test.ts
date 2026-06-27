import { describe, test } from "bun:test"

import { makeNPM } from "../targets/npm.js"
import { testScan } from "../testScan.test.js"

const elfJS = `
module.exports = elf =>
  console.log("i'm a elf")
`

describe.skipIf(!process.env.TEST_PACKLIST)("npm-packlist bundled-missing-optional", () => {
	test("includes bundled dependency using bundleDependencies even if optional dep is missing", async (done) => {
		await testScan(
			done,
			{
				".npmrc": "packaged=false",
				"elf.js": elfJS,
				node_modules: {
					history: {
						"index.js": elfJS,
						"package.json": JSON.stringify({
							main: "index.js",
							name: "history",
							optionalDependencies: {
								// defined here, but not installed
								optionalDep: "^1.0.0",
							},
							version: "1.0.0",
						}),
					},
				},
				"package.json": JSON.stringify({
					bundleDependencies: ["history"],
					dependencies: {
						history: "1.0.0",
					},
					main: "elf.js",
					name: "test-package",
					version: "3.1.4",
				}),
			},
			[
				"elf.js",
				"node_modules/history/index.js",
				"node_modules/history/package.json",
				"package.json",
			],
			{ target: makeNPM(), dirs: false },
		)
	})
})
