import { describe, test } from "bun:test"

import { runPacklistTest } from "./runPacklistTest.js"

describe("gitignore-fallback-warning", () => {
	test("warns when root has only .gitignore and no .npmignore", async () => {
		await runPacklistTest(
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
		)
	})

	test("does not warn when root has .npmignore and subdir has .gitignore", async () => {
		await runPacklistTest(
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
		)
	})

	test("does not warn when package.json has files field", async () => {
		await runPacklistTest(
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
		)
	})
})
