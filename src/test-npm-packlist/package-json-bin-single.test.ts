import { describe, test } from "bun:test"

import { makeNPM } from "../targets/npm.js"
import { testScan } from "../testScan.test.js"

describe.skipIf(!process.env.TEST_PACKLIST)("npm-packlist package-json-bin-single", () => {
	test("follows npm package ignoring rules", async (done) => {
		const bin = `
#!/usr/bin/env node
require("../lib/elf")()
`

		const elfJS = `
module.exports = elf =>
  console.log("i'm angry about elves")
`
		await testScan(
			done,
			{
				__bin: bin,
				dummy: "ignore",
				lib: {
					"elf.js": elfJS,
				},
				"package.json": JSON.stringify({
					bin: "__bin",
					files: ["lib"],
					name: "test-package",
					version: "1.6.2",
				}),
			},
			["__bin", "lib/elf.js", "package.json"],
			{ target: makeNPM() },
		)
	})
})
