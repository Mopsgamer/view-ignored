import { describe, test } from "bun:test"

import { makeNPM } from "../targets/npm.js"
import { testScan } from "../testScan.test.js"

describe.skipIf(!process.env.TEST_PACKLIST)(
	"npm-packlist cannot-include-non-file-or-directory",
	() => {
		test("cannot include something that exists but is neither a file nor a directory", async (done) => {
			await testScan(
				done,
				{
					device: "not a file or dir",
					"index.js": "",
					lib: {
						socket: "not a file or dir",
					},
					"package.json": JSON.stringify({
						files: ["lib", "device"],
						main: "index.js",
						name: "root",
						version: "1.0.0",
					}),
				},
				["index.js", "package.json"],
				{ target: makeNPM() },
			)
		})
	},
)
