import { describe, test } from "bun:test"

import { makeNPM } from "../targets/npm.js"
import { testScan } from "../testScan.test.js"

const elfJS = `
module.exports = elf =>
  console.log("i'm a elf")
`

describe.skipIf(!process.env.TEST_PACKLIST)("npm-packlist bundled-symlink", () => {
	test("includes bundled dependency that is a symlink", async (done) => {
		await testScan(
			done,
			{
				".npmrc": "packaged=false",
				"elf.js": elfJS,
				node_modules: {},
				history: {
					"index.js": elfJS,
					lib: {},
					"package.json": JSON.stringify({
						files: ["index.js", "lib/"],
						main: "index.js",
						name: "history",
						version: "1.0.0",
					}),
					tests: {
						"test.js": "please do not include me",
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
			{ target: makeNPM() },
			{
				"node_modules/history": "../history",
				"history/lib/linky": "../tests",
			},
		)
	})
})
