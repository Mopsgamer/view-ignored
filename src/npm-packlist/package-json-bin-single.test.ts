/* eslint-disable sort-keys */
import { describe, test } from "bun:test"

import { elfJS, bin } from "../test-utils.js"
import { runPacklistTest } from "./runPacklistTest.js"

describe("package-json-bin-single", () => {
	// https://github.com/npm/npm-packlist/blob/79d3761d6ab491ceeb192e2b88d0853d57048768/test/package-json-bin-single.js#L30
	test("follows npm package ignoring rules", () =>
		runPacklistTest(
			{
				"package.json": JSON.stringify({
					name: "test-package",
					version: "1.6.2",
					bin: "__bin",
					files: ["lib"],
				}),
				__bin: bin,
				lib: {
					"elf.js": elfJS,
				},
				dummy: "ignore",
			},
			["__bin", "lib/elf.js", "package.json"],
			{},
		))
})
