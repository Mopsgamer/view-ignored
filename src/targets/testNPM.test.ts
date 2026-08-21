import { describe, test, expect } from "bun:test"

import { testScan } from "../testScan.test.js"
import { makeNPM } from "./npm.js"
import {
	npmManifestParse,
	resolveBundledDeps,
	initNpmContext,
	createNpmContext,
	extractManifestIncludes,
	type PackageJson,
} from "./npmManifest.js"

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

				const src = ctx.external.get(".")
				expect(src).toBeObject()
				if (src && "path" in src) {
					expect(src.path).toBe("package.json")
				}
			},
			{ cwd: process.cwd() + "/test/packages/a", target: makeNPM() },
		)
	})

	test("ignores node_modules", async (done) => {
		await testScan(
			done,
			{ node_modules: { a: "" }, "package.json": packageJsonNoFiles },
			["package.json"],
			{ target: makeNPM() },
		)
	})

	test("throws an error if package.json is invalid", async (done) => {
		expect(() =>
			testScan(done, { "package.json": "{ invalid json }" }, () => {}, { target: makeNPM() }),
		).toThrow()
		expect(() =>
			testScan(done, { "package.json": "{}" }, () => {}, { target: makeNPM() }),
		).toThrow()
		expect(() =>
			testScan(done, { "package.json": '{ "name": 0, "version": 0 }' }, () => {}, {
				target: makeNPM(),
			}),
		).toThrow()
	})

	test("bundle mode skips root default excludes", async (done) => {
		await testScan(
			done,
			{
				"package-lock.json": "{}",
				"package.json": packageJsonNoFiles,
			},
			["package.json", "package-lock.json"],
			{ target: makeNPM("bundle") },
		)
	})

	test("list mode parses files correctly", async (done) => {
		await testScan(
			done,
			{
				"README.md": "",
				"package.json": packageJsonNoFiles,
			},
			["README.md", "package.json"],
			{ target: makeNPM("list") },
		)
	})

	test("anchors root file entries in package.json files array", async (done) => {
		await testScan(
			done,
			{
				"README.md": "root readme",
				demo: {
					git: {
						"README.md": "nested readme",
					},
					"runkit.js": "demo script",
				},
				"package.json": JSON.stringify({
					files: ["README.md", "demo/runkit.js"],
					name: "test-pkg",
					version: "1.0.0",
				}),
			},
			["README.md", "demo/runkit.js", "package.json"],
			{ dirs: false, target: makeNPM() },
		)
	})

	describe("npmManifestParse detailed validation rules", () => {
		test("validates private, semver, bundle, engines, scripts, and bin fields", () => {
			expect(() => npmManifestParse(JSON.stringify({ private: "invalid" }))).toThrow(
				"'private' field must be a boolean",
			)

			expect(() =>
				npmManifestParse(JSON.stringify({ name: "INVALID_NAME", version: "1.0.0" })),
			).toThrow("is not a valid npm package name")

			expect(() =>
				npmManifestParse(JSON.stringify({ name: "valid-name", version: "invalid-semver" })),
			).toThrow("is not a valid SemVer version")

			expect(() =>
				npmManifestParse(
					JSON.stringify({
						bundleDependencies: true,
						bundledDependencies: true,
						name: "pkg",
						version: "1.0.0",
					}),
				),
			).toThrow("cannot contain both")

			expect(() =>
				npmManifestParse(
					JSON.stringify({
						engines: "invalid",
						name: "pkg",
						version: "1.0.0",
					}),
				),
			).toThrow("'engines' field must be an object")

			expect(() =>
				npmManifestParse(
					JSON.stringify({
						name: "pkg",
						scripts: { test: 123 },
						version: "1.0.0",
					}),
				),
			).toThrow("'scripts' field must be an object with string values")

			expect(() =>
				npmManifestParse(
					JSON.stringify({
						dependencies: { dep: 123 },
						name: "pkg",
						version: "1.0.0",
					}),
				),
			).toThrow("'dependencies' field must be an object with string values")

			expect(() =>
				npmManifestParse(
					JSON.stringify({
						devDependencies: { dep: 123 },
						name: "pkg",
						version: "1.0.0",
					}),
				),
			).toThrow("'devDependencies' field must be an object with string values")

			expect(() =>
				npmManifestParse(
					JSON.stringify({
						name: "pkg",
						optionalDependencies: { dep: 123 },
						version: "1.0.0",
					}),
				),
			).toThrow("'optionalDependencies' field must be an object with string values")

			expect(() =>
				npmManifestParse(
					JSON.stringify({
						files: "invalid",
						name: "pkg",
						version: "1.0.0",
					}),
				),
			).toThrow("'files' field must be an array of strings")

			expect(() =>
				npmManifestParse(
					JSON.stringify({
						bundleDependencies: "invalid",
						name: "pkg",
						version: "1.0.0",
					}),
				),
			).toThrow("'bundleDependencies' field must be a boolean or an array of strings")

			expect(() =>
				npmManifestParse(
					JSON.stringify({
						bin: 123,
						name: "pkg",
						version: "1.0.0",
					}),
				),
			).toThrow("'bin' field must be a string or an object with string values")

			expect(npmManifestParse("invalid json", "list")).toEqual({} as PackageJson)
			expect(npmManifestParse("invalid json", "bundle")).toEqual({} as PackageJson)
		})
	})

	test("resolveBundledDeps with invalid dependency package.json", (done) => {
		// oxlint-disable-next-line typescript/no-explicit-any
		const mockFs: any = {
			// oxlint-disable-next-line typescript/no-explicit-any
			readFile: (p: string, cb: any) => {
				if (p.includes("node_modules/dep-a/package.json")) {
					cb(null, Buffer.from("{ invalid json"))
				} else {
					cb(new Error("ENOENT"))
				}
			},
		}

		// oxlint-disable-next-line typescript/no-explicit-any
		const manifest: any = {
			bundleDependencies: ["dep-a"],
			dependencies: { "dep-a": "^1.0.0" },
		}

		resolveBundledDeps("/root", mockFs, manifest, (err, deps) => {
			expect(err).toBeNull()
			expect(deps).toContain("dep-a")
			done()
		})
	})

	test("initNpmContext error reading package.json and patchedDependencies", (done) => {
		const ctx = createNpmContext("publish")
		// oxlint-disable-next-line typescript/no-explicit-any
		const mockFs: any = {
			// oxlint-disable-next-line typescript/no-explicit-any
			readFile: (_p: string, cb: any) => {
				const err = new Error("ENOENT")
				// oxlint-disable-next-line typescript/no-explicit-any
				;(err as any).code = "ENOENT"
				cb(err)
			},
		}

		initNpmContext(ctx, { cwd: "/nonexistent", fs: mockFs }, (err) => {
			expect(err).toBeInstanceOf(Error)
			expect(err?.message).toContain("package.json' not found")

			const ctx2 = createNpmContext("publish")
			// oxlint-disable-next-line typescript/no-explicit-any
			const mockFs2: any = {
				// oxlint-disable-next-line typescript/no-explicit-any
				readFile: (_p: string, cb: any) => {
					cb(
						null,
						Buffer.from(
							JSON.stringify({
								name: "my-pkg",
								patchedDependencies: { "some-dep": "./patches/some-dep.patch" },
								version: "1.0.0",
							}),
						),
					)
				},
			}

			initNpmContext(ctx2, { cwd: "/pkg", fs: mockFs2 }, (err2) => {
				expect(err2).toBeNull()
				expect(ctx2.patchedDepsExclude.has("patches/some-dep.patch")).toBeTrue()
				done()
			})
		})
	})

	test("extractManifestIncludes with object bin field", () => {
		const dist: Record<string, string> = {}
		extractManifestIncludes(
			{
				bin: { tool1: "./bin/tool1.js", tool2: "bin/tool2.js" },
				main: "index.js",
			} as unknown as PackageJson,
			dist,
		)
		expect(dist["bin.tool1"]).toBe("bin/tool1.js")
		expect(dist["bin.tool2"]).toBe("bin/tool2.js")
	})
})
