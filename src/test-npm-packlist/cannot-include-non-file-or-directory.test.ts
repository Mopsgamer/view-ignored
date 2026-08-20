// Original test case verifying npm-packlist behavior for cannot-include-non-file-or-directory.
// https://github.com/npm/npm-packlist/blob/d1eed617b1ff1eedf5909efec7867aee385d0350/test/cannot-include-non-file-or-directory.js

import { describe, test } from "bun:test"

import { makeNPM } from "../targets/npm.js"
import { testScan } from "../testScan.test.js"

describe.skipIf(process.env.TEST_PACKLIST == "0")(
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
				{ target: makeNPM(), dirs: false },
			)
		})
	},
)
