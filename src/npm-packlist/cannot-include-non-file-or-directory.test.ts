/* eslint-disable sort-keys */
import { describe, test } from "bun:test"

import { runPacklistTest } from "./runPacklistTest.js"

describe("cannot-include-non-file-or-directory", () => {
	// https://github.com/npm/npm-packlist/blob/79d3761d6ab491ceeb192e2b88d0853d57048768/test/cannot-include-non-file-or-directory.js#L8
	test("cannot include something that exists but is neither a file nor a directory", () =>
		runPacklistTest(
			{
				"package.json": JSON.stringify({
					name: "root",
					version: "1.0.0",
					main: "index.js",
					files: ["lib", "device"],
				}),
				"index.js": "",
				lib: {
					socket: "",
				},
				device: "",
			},
			["index.js", "package.json"],
			{},
		))
})
