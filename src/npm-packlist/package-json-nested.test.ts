/* eslint-disable sort-keys */
import { describe, test } from "bun:test"

import { runPacklistTest } from "./runPacklistTest.js"

describe("package-json-nested", () => {
	// https://github.com/npm/npm-packlist/blob/79d3761d6ab491ceeb192e2b88d0853d57048768/test/package-json-nested.js#L23
	test("includes nested package.json file", () =>
		runPacklistTest(
			{
				"package.json": JSON.stringify({
					name: "test-package",
					version: "1.2.3",
				}),
				nest: {
					"package.json": JSON.stringify({
						name: "nested-package",
						version: "1.2.3",
						files: ["index.js"],
					}),
					"index.js": 'console.log("hi")',
					"foo.js": 'console.log("no")',
				},
			},
			["nest/foo.js", "nest/index.js", "nest/package.json", "package.json"],
			{},
		))
})
