import { describe, test } from "bun:test"

import { runPacklistTest } from "./runPacklistTest.js"

describe("cannot-include-non-file-or-directory", () => {
	test("cannot include something that exists but is neither a file nor a directory", async () => {
		await runPacklistTest(
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
		)
	})
})
