/* eslint-disable sort-keys */
import { describe, test } from "bun:test"

import { elfJS } from "../test-utils.js"
import { runPacklistTest } from "./runPacklistTest.js"

describe("bundled-scoped-symlink", () => {
	// https://github.com/npm/npm-packlist/blob/79d3761d6ab491ceeb192e2b88d0853d57048768/test/bundled-scoped-symlink.js#L51
	test("includes bundled dependency", () =>
		runPacklistTest(
			{
				pkg: {
					"package.json": JSON.stringify({
						name: "test-package",
						version: "3.1.4",
						main: "elf.js",
						dependencies: {
							"@npmwombat/history": "1.0.0",
						},
						bundleDependencies: ["@npmwombat/history"],
					}),
					"elf.js": elfJS,
					".npmrc": "packaged=false",
					node_modules: {
						"@npmwombat": {
							history: { isSymlink: true, path: "../../../history" },
						},
					},
				},
				history: {
					"package.json": JSON.stringify({
						name: "@npmwombat/history",
						version: "1.0.0",
						main: "index.js",
						files: ["index.js", "lib/"],
					}),
					"index.js": elfJS,
					tests: {
						"test.js": "please do not include me",
					},
					// this should not be followed, even though the bundled dep is
					lib: {
						linky: { isSymlink: true, path: "../tests" },
					},
				},
			},
			[
				"elf.js",
				"node_modules/@npmwombat/history/index.js",
				"node_modules/@npmwombat/history/package.json",
				"package.json",
			],
			{ cwd: "pkg" },
		))
})
