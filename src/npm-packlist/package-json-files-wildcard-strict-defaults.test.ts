/* eslint-disable sort-keys */
import { describe, test } from "bun:test"

import { runPacklistTest } from "./runPacklistTest.js"

describe("package-json-files-wildcard-strict-defaults", () => {
	// https://github.com/npm/npm-packlist/blob/79d3761d6ab491ceeb192e2b88d0853d57048768/test/package-json-files-wildcard-strict-defaults.js#L32
	test("wildcard files[] does not override strict default ignores", () =>
		runPacklistTest(
			{
				"package.json": JSON.stringify({
					files: ["**/*"],
				}),
				".git": {
					HEAD: "ref: refs/heads/main\n",
					config: "[core]\n",
				},
				".npmrc": "always-auth=true\n",
				node_modules: {
					foo: {
						"package.json": JSON.stringify({ name: "foo", version: "1.0.0" }),
						"index.js": 'module.exports = "foo"\n',
					},
				},
				src: {
					"index.js": 'module.exports = "src"\n',
					".hidden.js": 'module.exports = "hidden"\n',
				},
				"README.md": "# wildcard files test\n",
			},
			["src/.hidden.js", "src/index.js", "package.json", "README.md"],
			{},
		))
})
