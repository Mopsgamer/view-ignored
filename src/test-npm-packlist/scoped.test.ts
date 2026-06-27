import { describe, test } from "bun:test"

import { makeNPM } from "../targets/npm.js"
import { testScan } from "../testScan.test.js"

describe.skipIf(!process.env.TEST_PACKLIST)("npm-packlist scoped", () => {
	test("includes bundledDependencies", async (done) => {
		const elfJS = `
module.exports = elf =>
  console.log("i'm a elf")
`
		await testScan(
			done,
			{
				"elf.js": elfJS,
				node_modules: {
					"@ignore": {
						scoped: {
							"index.js": "console.log('i do not want to be bundled')",
						},
					},
					"@npmwombat": {
						no: {
							"wombat.js": "console.log('no bundle please')",
						},
						scoped: {
							"index.js": "console.log('hello wombat')",
						},
					},
				},
				"package.json": JSON.stringify({
					bundledDependencies: ["@npmwombat/scoped"],
					dependencies: {
						"@npmwombat/scoped": "1.0.0",
					},
					main: "elf.js",
					name: "test-package-scoped",
					version: "3.1.4",
				}),
			},
			["elf.js", "node_modules/@npmwombat/scoped/index.js", "package.json"],
			{ target: makeNPM(), dirs: false },
		)
	})
})
