import { describe, test } from "bun:test"

import { makeNPM } from "../targets/npm.js"
import { testScan } from "../testScan.test.js"

describe.skipIf(!process.env.TEST_PACKLIST)("npm-packlist cannot-include-npm-extension", () => {
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
})
