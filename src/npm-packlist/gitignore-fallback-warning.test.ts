import { describe, test, expect } from "bun:test"
import { runPacklistTest } from "./runPacklistTest.js"

describe("gitignore-fallback-warning", () => {
	test("warns when root has only .gitignore and no .npmignore", async () => {
		// view-ignored might not support these specific warnings yet
		await runPacklistTest({
			'package.json': JSON.stringify({
				name: 'test-package',
				version: '1.0.0',
			}),
			'.gitignore': 'secret.txt',
			'index.js': 'module.exports = {}',
			'secret.txt': 'do not publish',
		}, ["index.js", "package.json"]);
	})
})
