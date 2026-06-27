import { describe, test } from "bun:test"

import { makeNPM } from "../targets/npm.js"
import { testScan } from "../testScan.test.js"

describe.skipIf(!process.env.TEST_PACKLIST)(
	"npm-packlist package-json-files-nested-dir-and-nested-ignore",
	() => {
		test("package with negated files", async (done) => {
			await testScan(
				done,
				{
					lib: {
						".DS_Store": "a store of ds",
						".npmignore": "dir/two.js",
						dir: {
							"for.js": "for",
							"one.js": "one",
							"tre.js": "tre",
							"two.js": "two",
						},
					},
					"package.json": JSON.stringify({
						files: ["lib/dir"],
						name: "test-package",
						version: "1.0.0",
					}),
				},
				["lib/dir/for.js", "lib/dir/one.js", "lib/dir/tre.js", "package.json"],
				{ target: makeNPM(), dirs: false },
			)
		})
	},
)
