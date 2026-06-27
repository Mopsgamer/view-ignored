import { describe, test } from "bun:test"

import { makeNPM } from "../targets/npm.js"
import { testScan } from "../testScan.test.js"

const elfJS = `
module.exports = elf =>
  console.log("i'm a elf")
`

describe.skipIf(!process.env.TEST_PACKLIST)("npm-packlist bundled-files", () => {
	test("includes bundled dependency using bundleDependencies", async (done) => {
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
							version: "1.0.0",
						}),
					},
				},
				"package.json": JSON.stringify({
					bundleDependencies: ["history"],
					dependencies: {
						history: "1.0.0",
					},
					files: ["elf.js"],
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

	test("includes bundled dependency using bundledDependencies", async (done) => {
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
							version: "1.0.0",
						}),
					},
				},
				"package.json": JSON.stringify({
					bundledDependencies: ["history"],
					dependencies: {
						history: "1.0.0",
					},
					files: ["elf.js"],
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
