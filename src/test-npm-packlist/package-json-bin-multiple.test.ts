// Original test case verifying npm-packlist behavior for package-json-bin-multiple.
// https://github.com/npm/npm-packlist/blob/d1eed617b1ff1eedf5909efec7867aee385d0350/test/package-json-bin-multiple.js

import { describe, test } from "bun:test"

import { makeNPM } from "../targets/npm.js"
import { testScan } from "../testScan.test.js"

describe.skipIf(process.env.TEST_PACKLIST == "0")("npm-packlist package-json-bin-multiple", () => {
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
				__bin_bar: bin,
				__bin_foo: bin,
				dummy: "ignore this",
				lib: {
					"elf.js": elfJS,
				},
				"package.json": JSON.stringify({
					bin: {
						bar: "__bin_bar",
						foo: "__bin_foo",
					},
					files: ["lib"],
					name: "test-package",
					version: "1.6.2",
				}),
			},
			["__bin_bar", "__bin_foo", "lib/elf.js", "package.json"],
			{ target: makeNPM(), dirs: false },
		)
	})
})
