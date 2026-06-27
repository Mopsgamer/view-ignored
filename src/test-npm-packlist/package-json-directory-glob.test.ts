import { describe, test } from "bun:test"

import { makeNPM } from "../targets/npm.js"
import { testScan } from "../testScan.test.js"

const createTree = (files: string[]) => ({
	folder: {
		one: { file: "one" },
		two: { file: "two" },
	},
	folder1: {
		one: { file: "one" },
		two: { file: "two" },
	},
	"package.json": JSON.stringify({
		files,
		name: "test-package",
		version: "1.0.0",
	}),
})

describe.skipIf(!process.env.TEST_PACKLIST)("npm-packlist package-json-directory-glob", () => {
	const pkgFiles = ["folder", "folder/", "./folder/", "folder/**", "folder/**/*"]

	for (const files of pkgFiles) {
		test(files, async (done) => {
			await testScan(
				done,
				createTree([files]),
				["folder/one/file", "folder/two/file", "package.json"],
				{ target: makeNPM(), dirs: false },
			)
		})
	}

	test("folder/* matches direct children, expanding subdirectory matches", async (done) => {
		await testScan(
			done,
			createTree(["folder/*"]),
			["folder/one/file", "folder/two/file", "package.json"],
			{ target: makeNPM(), dirs: false },
		)
	})

	test("folder/* with mixed depth-1 entries (file + subdir)", async (done) => {
		await testScan(
			done,
			{
				dist: {
					sub: {
						"deep.js": "deep",
					},
					"top.js": "top",
				},
				"package.json": JSON.stringify({
					files: ["dist/*"],
					name: "test-package",
					version: "1.0.0",
				}),
			},
			["dist/sub/deep.js", "dist/top.js", "package.json"],
			{ target: makeNPM(), dirs: false },
		)
	})

	test("dist-* (cli#7514) includes contents of matched directories", async (done) => {
		await testScan(
			done,
			{
				"dist-cjs": { "index.js": "cjs" },
				"dist-es": { "index.js": "es" },
				"dist-other.js": "other",
				"package.json": JSON.stringify({
					files: ["dist-*"],
					name: "cli-7514",
					version: "1.0.0",
				}),
			},
			["dist-cjs/index.js", "dist-es/index.js", "dist-other.js", "package.json"],
			{ target: makeNPM(), dirs: false },
		)
	})

	test("lib/ + !lib/test/ (npm-packlist#152) excludes a nested directory", async (done) => {
		await testScan(
			done,
			{
				lib: {
					"foo.js": "foo",
					"main.js": "main",
					test: {
						"foo_test.js": "ft",
						"main_test.js": "mt",
						utils: { "foo-util_test.js": "ut" },
					},
					utils: { "foo-util.js": "util" },
				},
				"package.json": JSON.stringify({
					files: ["lib/", "!lib/test/"],
					name: "pl-152",
					version: "1.0.0",
				}),
			},
			["lib/foo.js", "lib/main.js", "lib/utils/foo-util.js", "package.json"],
			{ target: makeNPM(), dirs: false },
		)
	})

	test('an entry that normalizes to empty (e.g. "./" or "/") is dropped', async (done) => {
		await testScan(
			done,
			{
				"a.js": "",
				"b.js": "",
				"package.json": JSON.stringify({
					files: ["./", "/", "a.js"],
					name: "empty-entry",
					version: "1.0.0",
				}),
			},
			["a.js", "package.json"],
			{ target: makeNPM(), dirs: false },
		)
	})
})
