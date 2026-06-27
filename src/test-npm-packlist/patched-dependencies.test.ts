import { describe, test } from "bun:test"

import { makeNPM } from "../targets/npm.js"
import { testScan } from "../testScan.test.js"

describe.skipIf(!process.env.TEST_PACKLIST)("npm-packlist patched-dependencies", () => {
	test('a dedicated patch dir is dropped even when listed in "files"', async (done) => {
		await testScan(
			done,
			{
				lib: { "index.js": "code" },
				"package.json": JSON.stringify({
					files: ["lib", "patches"],
					name: "p",
					patchedDependencies: { "abbrev@2.0.0": "patches/abbrev@2.0.0.patch" },
					version: "1.0.0",
				}),
				patches: { "abbrev@2.0.0.patch": "the patch" },
			},
			["lib/index.js", "package.json"],
			{ target: makeNPM(), dirs: false },
		)
	})

	test("a patch file in a shared dir is dropped without dropping the rest of the dir", async (done) => {
		await testScan(
			done,
			{
				"package.json": JSON.stringify({
					name: "p",
					patchedDependencies: { "abbrev@2.0.0": "src/abbrev@2.0.0.patch" },
					version: "1.0.0",
				}),
				src: { "abbrev@2.0.0.patch": "the patch", "index.js": "code" },
			},
			["src/index.js", "package.json"],
			{ target: makeNPM(), dirs: false },
		)
	})

	test("malformed, absolute, and escaping patch paths are skipped safely", async (done) => {
		await testScan(
			done,
			{
				"index.js": "code",
				"package.json": JSON.stringify({
					name: "p",
					patchedDependencies: {
						// an absolute path is never packed, so it is skipped
						a: "/etc/passwd.patch",
						// a non-string value is skipped
						b: { not: "a string" },
						// a path that escapes the package root is skipped
						c: "../evil.patch",
						// a valid relative patch file is excluded
						d: "patches/abbrev@2.0.0.patch",
					},
					version: "1.0.0",
				}),
				patches: { "abbrev@2.0.0.patch": "the patch" },
			},
			["index.js", "package.json"],
			{ target: makeNPM(), dirs: false },
		)
	})

	test("a bundled dependency with patchedDependencies does not prune its own files", async (done) => {
		await testScan(
			done,
			{
				"index.js": "code",
				node_modules: {
					dep: {
						"index.js": "dep code",
						"package.json": JSON.stringify({
							name: "dep",
							patchedDependencies: { "x@1.0.0": "patches/x@1.0.0.patch" },
							version: "1.0.0",
						}),
						patches: { "x@1.0.0.patch": "should still ship from a bundled dep" },
					},
				},
				"package.json": JSON.stringify({
					bundleDependencies: ["dep"],
					dependencies: { dep: "1.0.0" },
					name: "p",
					version: "1.0.0",
				}),
			},
			[
				"index.js",
				"node_modules/dep/index.js",
				"node_modules/dep/package.json",
				"node_modules/dep/patches/x@1.0.0.patch",
				"package.json",
			],
			{ target: makeNPM(), dirs: false },
		)
	})
})
