import { describe, test } from "bun:test"

import { makeNPM } from "../targets/npm.js"
import { testScan } from "../testScan.test.js"

describe.skipIf(!process.env.TEST_PACKLIST)("npm-packlist package-json-roots-and-nests", () => {
	test("package with negated files", async (done) => {
		await testScan(
			done,
			{
				".npmignore": "lib/*",
				"bin.js": "bin",
				"browser.js": "browser",
				inc: {
					foo: "include me plz",
					"package-lock.json": "include me plz",
					"package.json": JSON.stringify({ files: [] }),
				},
				lib: {
					"bin.js": "bin",
					"browser.js": "browser",
					"main.js": "main",
					"npm-shrinkwrap.json": "sw",
					"package-lock.json": "sw",
					"package.json.js": "{}",
				},
				"main.js": "main",
				node_modules: {
					"@foo": {
						bar: {
							".DS_Store": "not this tho",
						},
					},
					foo: {
						"package-lock.json": "include",
					},
				},
				"package-lock.json": "sw",
				"package.json": JSON.stringify({
					bin: "bin.js",
					browser: "browser.js",
					bundleDependencies: ["foo", "@foo/bar"],
					dependencies: {
						"@foo/bar": "1.0.0",
						foo: "1.0.0",
					},
					main: "main.js",
					name: "test-package",
					version: "1.0.0",
				}),
			},
			[
				"node_modules/@foo/bar/.DS_Store",
				"inc/foo",
				"bin.js",
				"browser.js",
				"main.js",
				"inc/package-lock.json",
				"node_modules/foo/package-lock.json",
				"inc/package.json",
				"package.json",
			],
			{ target: makeNPM(), dirs: false },
		)
	})
})
