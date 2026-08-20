// Original test case verifying npm-packlist behavior for cannot-include-npm-extension.
// https://github.com/npm/npm-packlist/blob/d1eed617b1ff1eedf5909efec7867aee385d0350/test/cannot-include-npm-extension.js

import { describe, test } from "bun:test"

import { makeNPM } from "../targets/npm.js"
import { testScan } from "../testScan.test.js"

describe.skipIf(process.env.TEST_PACKLIST == "0")(
	"npm-packlist cannot-include-npm-extension",
	() => {
		test("try to include .npm-extension files but cannot", async (done) => {
			await testScan(
				done,
				{
					".npm-extension.cjs": "module.exports = { transformManifest (p) { return p } }\n",
					".npm-extension.mjs": "export function transformManifest (p) { return p }\n",
					lib: { "index.js": "" },
					"package.json": JSON.stringify({
						files: ["lib", ".npm-extension.mjs", ".npm-extension.cjs"],
						name: "test-package",
						version: "1.0.0",
					}),
				},
				["lib/index.js", "package.json"],
				{ target: makeNPM(), dirs: false },
			)
		})
	},
)
