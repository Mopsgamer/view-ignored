import { describe, test, expect } from "bun:test"

import { RuleMatchKind } from "../patterns/rule.js"
import { testScan } from "../testScan.test.js"
import { makeNPM } from "./npm.js"

const packageJsonNoFiles = JSON.stringify({
	name: "me",
	version: "0.0.1",
})

describe("NPM", () => {
	test("empty for empty", async (done) => {
		await testScan(done, { ".": null, "package.json": packageJsonNoFiles }, ["package.json"], {
			target: makeNPM(),
		})
	})

	test("includes for no sources", async (done) => {
		await testScan(
			done,
			{ file: "", "package.json": packageJsonNoFiles },
			["file", "package.json"],
			{ target: makeNPM() },
		)
	})

	test("keeps for empty source", async (done) => {
		await testScan(
			done,
			{
				".npmignore": "",
				filekeep: "",
				"package.json": packageJsonNoFiles,
			},
			["filekeep", "package.json"],
			{ target: makeNPM() },
		)
	})

	test("ignores file", async (done) => {
		await testScan(
			done,
			{
				".npmignore": "file",
				file: "",
				"package.json": packageJsonNoFiles,
			},
			["package.json"],
			{ target: makeNPM() },
		)
	})

	test("ignores multiple files", async (done) => {
		await testScan(
			done,
			{
				".npmignore": "file1.txt\nfile2.txt",
				"file1.txt": "",
				"file2.txt": "",
				"package.json": packageJsonNoFiles,
			},
			["package.json"],
			{ target: makeNPM() },
		)
	})

	test("ignores files with pattern", async (done) => {
		await testScan(
			done,
			{
				".npmignore": "*.js",
				"bar.js": "",
				"foo.js": "",
				"package.json": packageJsonNoFiles,
			},
			["package.json"],
			{ target: makeNPM() },
		)
	})

	test("ignores files in subdirectory", async (done) => {
		await testScan(
			done,
			{
				".npmignore": "src/",
				"package.json": packageJsonNoFiles,
				src: {
					"helper.js": "",
					"main.js": "",
				},
			},
			["package.json"],
			{ target: makeNPM() },
		)
	})

	test("does not ignore files not matching pattern", async (done) => {
		await testScan(
			done,
			{
				".npmignore": "*.js",
				"bar.js": "",
				"foo.txt": "",
				"package.json": packageJsonNoFiles,
			},
			["foo.txt", "package.json"],
			{ target: makeNPM() },
		)
	})

	test("negation pattern keeps file", async (done) => {
		await testScan(
			done,
			{
				".npmignore": "*.js\n!bar.js",
				"bar.js": "",
				"foo.js": "",
				"package.json": packageJsonNoFiles,
			},
			["bar.js", "package.json"],
			{ target: makeNPM() },
		)
	})

	test("monorepo should use package.json if cwd is .", async (done) => {
		await testScan(
			done,
			{
				file: "1",
				"index.js": "('src')",
				"index.ts": "('src')",
				"package.json": JSON.stringify({
					files: ["index.ts"],
					name: "root",
					version: "0.0.1",
				}),
				packages: {
					a: {
						"index.js": "('a')",
						"package.json": JSON.stringify({
							files: ["index.js"],
							name: "a",
							version: "0.0.1",
						}),
					},
				},
			},
			({ ctx }) => {
				expect(ctx.paths.has("file")).toBeFalse()
				expect(ctx.paths.get("index.ts")).toMatchObject({
					ignored: false,
					kind: RuleMatchKind.external,
					pattern: "index.ts",
				})
				expect(ctx.paths.has("index.js")).toBeFalse()
				expect(ctx.paths.has("packages/a/index.js")).toBeFalse()

				// oxlint-disable-next-line typescript/no-explicit-any
				const src = ctx.external.get("packages/a") as any
				expect(src).toBeObject()
				expect(src?.path).toBe("package.json")
			},
			{ cwd: process.cwd() + "/test", target: makeNPM() },
		)
	})
	test("monorepo should use packages/a/package.json if cwd is packages/a", async (done) => {
		await testScan(
			done,
			{
				file: "1",
				"index.js": "('src')",
				"index.ts": "('src')",
				"package.json": JSON.stringify({
					files: ["index.ts"],
					name: "root",
					version: "0.0.1",
				}),
				packages: {
					a: {
						"index.js": "('a')",
						"package.json": JSON.stringify({
							files: ["index.js"],
							name: "a",
							version: "0.0.1",
						}),
					},
				},
			},
			({ ctx }) => {
				expect(ctx.paths.has("file")).toBeFalse()
				expect(ctx.paths.has("index.ts")).toBeFalse()
				expect(ctx.paths.has("index.js")).toBeTrue()
				expect(ctx.paths.has("packages/a/index.js")).toBeFalse()

				expect(ctx.paths.get("packages/a/")).toBeUndefined()

				expect(ctx.external.get("packages/a")).toBeUndefined()

				// oxlint-disable-next-line typescript/no-explicit-any
				const src = ctx.external.get(".") as any
				expect(src).toBeObject()
				expect(src?.path).toBe("package.json")
			},
			{ cwd: process.cwd() + "/test/packages/a", target: makeNPM() },
		)
	})

	test("throws an error if package.json is invalid", async (done) => {
		expect(() =>
			testScan(done, { "package.json": "{ invalid json }" }, [], { target: makeNPM() }),
		).toThrow()
		expect(() => testScan(done, { "package.json": "{}" }, [], { target: makeNPM() })).toThrow()
		expect(() =>
			testScan(done, { "package.json": '{ "name": 0, "version": 0 }' }, [], { target: makeNPM() }),
		).toThrow()
	})
})
