/* eslint-disable sort-keys */
import { describe, test } from "bun:test"

import { runPacklistTest } from "./runPacklistTest.js"

describe("gitignore-fallback-warning", () => {
	/**
	 * @see https://github.com/npm/npm-packlist/blob/79d3761d6ab491ceeb192e2b88d0853d57048768/test/gitignore-fallback-warning.js#L7
	 */
	test("warns when root has only .gitignore and no .npmignore", () =>
		runPacklistTest(
			{
				"package.json": JSON.stringify({
					name: "test-package",
					version: "1.0.0",
				}),
				".gitignore": "secret.txt",
				"index.js": "module.exports = {}",
				"secret.txt": "do not publish",
			},
			["index.js", "package.json"],
		))

	/**
	 * @see https://github.com/npm/npm-packlist/blob/79d3761d6ab491ceeb192e2b88d0853d57048768/test/gitignore-fallback-warning.js#L34
	 */
	test("does not warn when root has .npmignore and subdir has .gitignore", () =>
		runPacklistTest(
			{
				"package.json": JSON.stringify({
					name: "test-package",
					version: "1.0.0",
				}),
				".npmignore": "secret.txt",
				"index.js": "module.exports = {}",
				subdir: {
					".gitignore": "*.log",
					"lib.js": "module.exports = {}",
					"debug.log": "debug output",
				},
			},
			["index.js", "package.json", "subdir/lib.js"],
		))

	/**
	 * @see https://github.com/npm/npm-packlist/blob/79d3761d6ab491ceeb192e2b88d0853d57048768/test/gitignore-fallback-warning.js#L64
	 */
	test("does not warn when package.json has files field", () =>
		runPacklistTest(
			{
				"package.json": JSON.stringify({
					name: "test-package",
					version: "1.0.0",
					files: ["index.js"],
				}),
				".gitignore": "secret.txt",
				"index.js": "module.exports = {}",
				"secret.txt": "do not publish",
			},
			["index.js", "package.json"],
		))
})
