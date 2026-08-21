import { describe, test, expect } from "bun:test"

import { makeNPM } from "../targets/npm.js"
import { type FsAdapter } from "../types.js"
import { MatcherStream } from "./matcherStream.js"
import { extractPackageJson } from "./packagejson.js"
import { patternListCompile, PatternSpec } from "./patternList.js"
import { resolveSources } from "./resolveSources.js"
import { ruleTestSync, RuleMatchKind, type CustomRule } from "./rule.js"
import { type Source } from "./source.js"
import { wildmatchCompile } from "./wildmatch.js"

function patternCacheTest(
	compiled: { re: { test(str: string): boolean } } | null,
	str: string,
): boolean {
	if (compiled === null) return false
	return compiled.re.test(str)
}

describe("patternListCompile", () => {
	test("compiles picomatch patterns by default", () => {
		expect(patternCacheTest(patternListCompile({ list: [".git"] }), ".git/message")).toBeTrue()
		expect(patternCacheTest(patternListCompile({ list: [".git"] }), ".Git/message")).toBeFalse()
		expect(
			patternCacheTest(patternListCompile({ list: [".git"], nocase: true }), ".Git/message"),
		).toBeTrue()
	})

	test("compiles with spec: PatternSpec.gitignore using wildmatch", () => {
		const compiled = patternListCompile({ list: ["foo*bar"], spec: PatternSpec.gitignore })
		expect(patternCacheTest(compiled, "foobazbar")).toBeTrue()
		expect(patternCacheTest(compiled, "foo/baz/bar")).toBeFalse()
	})

	test("case-insensitive compilation preserves ASCII range casing like [A-\\]", () => {
		const list = ["[A-\\\\]"]
		const compiled = patternListCompile({ list, nocase: true })
		expect(patternCacheTest(compiled, "G")).toBeTrue()
		expect(patternCacheTest(compiled, "g")).toBeTrue()
		expect(patternCacheTest(compiled, "A")).toBeTrue()
		expect(patternCacheTest(compiled, "a")).toBeTrue()
	})

	test("extractPackageJson error handling", () => {
		// oxlint-disable-next-line typescript/no-explicit-any
		const badSource = null as unknown as Source
		const err = extractPackageJson(badSource, Buffer.from("{}"))
		expect(err).toBeInstanceOf(Error)

		const source: Source = { dir: ".", inverted: false, path: "package.json", rules: [] }
		const err2 = extractPackageJson(source, Buffer.from("invalid json {"))
		expect(err2).toBeInstanceOf(Error)
	})

	test("wildmatchCompile empty list, invalid range, and regex fallback", () => {
		expect(() => wildmatchCompile({ list: [] })).toThrow(TypeError)

		const compiled = wildmatchCompile({ list: ["[z-a]"] })
		expect(compiled.re.test("a")).toBeFalse()
	})

	test("MatcherStream timeout, listeners and dispatch", () => {
		// oxlint-disable-next-line typescript/no-explicit-any
		const options: any = { cwd: ".", fs: {} as FsAdapter, noTimeout: true, target: makeNPM() }
		const stream = new MatcherStream(options)

		let listenerCalled = false
		const listener = () => {
			listenerCalled = true
		}

		// oxlint-disable-next-line typescript/no-explicit-any
		stream.addEventListener("end", listener as any)
		// oxlint-disable-next-line typescript/no-explicit-any
		stream.dispatchEvent(new CustomEvent("end", { detail: null }) as any)
		expect(listenerCalled).toBeTrue()

		listenerCalled = false
		// oxlint-disable-next-line typescript/no-explicit-any
		stream.removeEventListener("end", listener as any)
		// oxlint-disable-next-line typescript/no-explicit-any
		stream.dispatchEvent(new CustomEvent("end", { detail: null }) as any)
		expect(listenerCalled).toBeFalse()

		const timeoutStream = new MatcherStream({ cwd: ".", fs: {} as FsAdapter, target: makeNPM() })
		expect(() => {
			// oxlint-disable-next-line typescript/no-explicit-any
			clearTimeout((timeoutStream as any)["#timeout"])
		}).not.toThrow()
	})

	test("ruleTestSync CustomRule returning Error for internal and external rules", () => {
		const customErrorRule: CustomRule = {
			excludes: true,
			match: () => new Error("Custom match error"),
		}

		// oxlint-disable-next-line typescript/no-explicit-any
		const externalTarget: any = {
			internalRules: [],
		}

		const mockSource: Source = {
			dir: ".",
			inverted: false,
			path: ".gitignore",
			rules: [customErrorRule],
		}

		const matchExternal = ruleTestSync({
			cwd: ".",
			// oxlint-disable-next-line typescript/no-explicit-any
			dirent: { isDirectory: () => false, isFile: () => true, name: "foo.js" } as any,
			entry: "foo.js",
			// oxlint-disable-next-line typescript/no-explicit-any
			fs: {} as any,
			parentPath: ".",
			resource: mockSource,
			signal: null,
			target: externalTarget,
		})

		expect(matchExternal.kind).toBe(RuleMatchKind.invalidExternal)
		if (matchExternal.kind === RuleMatchKind.invalidExternal) {
			expect(matchExternal.error.message).toBe("Custom match error")
		}

		// oxlint-disable-next-line typescript/no-explicit-any
		const internalTarget: any = {
			internalRules: [customErrorRule],
		}

		const matchInternal = ruleTestSync({
			cwd: ".",
			// oxlint-disable-next-line typescript/no-explicit-any
			dirent: { isDirectory: () => false, isFile: () => true, name: "foo.js" } as any,
			entry: "foo.js",
			// oxlint-disable-next-line typescript/no-explicit-any
			fs: {} as any,
			parentPath: ".",
			resource: null,
			signal: null,
			target: internalTarget,
		})

		expect(matchInternal.kind).toBe(RuleMatchKind.invalidInternal)
		if (matchInternal.kind === RuleMatchKind.invalidInternal) {
			expect(matchInternal.error.message).toBe("Custom match error")
		}
	})

	test("ruleTestSync cacheTest unexpected sub-pattern failure exception", () => {
		// oxlint-disable-next-line typescript/no-explicit-any
		const compiled: any = {
			compiledItems: [{ test: () => false }],
			list: ["patternA", "patternB"],
			re: /foo/,
		}

		const mockSource: Source = {
			dir: ".",
			inverted: false,
			path: ".gitignore",
			rules: [{ compiled, excludes: true, list: ["patternA", "patternB"] }],
		}

		expect(() =>
			ruleTestSync({
				cwd: ".",
				// oxlint-disable-next-line typescript/no-explicit-any
				dirent: { isDirectory: () => false, isFile: () => true, name: "foo" } as any,
				entry: "foo",
				// oxlint-disable-next-line typescript/no-explicit-any
				fs: {} as any,
				parentPath: ".",
				resource: mockSource,
				signal: null,
				// oxlint-disable-next-line typescript/no-explicit-any
				target: { internalRules: [] } as any,
			}),
		).toThrow("view-ignored has crashed: expected sub-pattern")
	})

	test("resolveSources findExtendedRoot edge cases and extractor errors", (done) => {
		let callCount = 0
		// oxlint-disable-next-line typescript/no-explicit-any
		const mockFs: any = {
			// oxlint-disable-next-line typescript/no-explicit-any
			readFile: (path: string, cb: any) => {
				callCount++
				if (path.includes("package.json")) {
					cb(null, Buffer.from("{ invalid json syntax"))
				} else if (path.includes(".gitignore")) {
					cb(null, Buffer.from("dummy content"))
				} else {
					const err = new Error("ENOENT")
					// oxlint-disable-next-line typescript/no-explicit-any
					;(err as any).code = "ENOENT"
					cb(err)
				}
			},
		}

		// oxlint-disable-next-line typescript/no-explicit-any
		const mockTarget: any = {
			extendsRoot: "workspaces_field_unique_key_1",
			extractors: [
				{
					extract: () => {
						throw new Error("Extractor exception")
					},
					path: ".gitignore",
				},
			],
			root: ".",
		}

		resolveSources(
			{
				cwd: "/dir_unique_a/dir_b",
				dir: ".",
				external: new Map(),
				fs: mockFs,
				signal: null,
				target: mockTarget,
			},
			(err, res) => {
				expect(err).toBeNull()
				expect(res).not.toBeNull()
				if (res && "error" in res) {
					expect(res.error.message).toBe("Extractor exception")
				}
				expect(callCount).toBeGreaterThan(0)
				done()
			},
		)
	})

	test("resolveSources findExtendedRoot reaching filesystem root", (done) => {
		// oxlint-disable-next-line typescript/no-explicit-any
		const mockFs: any = {
			// oxlint-disable-next-line typescript/no-explicit-any
			readFile: (_path: string, cb: any) => {
				const err = new Error("ENOENT")
				// oxlint-disable-next-line typescript/no-explicit-any
				;(err as any).code = "ENOENT"
				cb(err)
			},
		}

		// oxlint-disable-next-line typescript/no-explicit-any
		const mockTarget: any = {
			extendsRoot: "workspaces_field_unique_key_2",
			extractors: [],
			root: ".",
		}

		resolveSources(
			{
				cwd: "/dir_root_test",
				dir: ".",
				external: new Map(),
				fs: mockFs,
				signal: null,
				target: mockTarget,
			},
			(err, _res) => {
				expect(err).toBeNull()
				done()
			},
		)
	})

	test("resolveSources launchDirectoryExtractors error propagation", (done) => {
		// oxlint-disable-next-line typescript/no-explicit-any
		const mockFs: any = {
			// oxlint-disable-next-line typescript/no-explicit-any
			readFile: (_path: string, cb: any) => {
				const err = new Error("Fatal FS error")
				// oxlint-disable-next-line typescript/no-explicit-any
				;(err as any).code = "EIO"
				cb(err)
			},
		}

		// oxlint-disable-next-line typescript/no-explicit-any
		const mockTarget: any = {
			extractors: [{ extract: () => {}, path: ".gitignore" }],
			root: ".",
		}

		resolveSources(
			{
				cwd: "/fs_error_dir",
				dir: ".",
				external: new Map(),
				fs: mockFs,
				signal: null,
				target: mockTarget,
			},
			(err, res) => {
				expect(err).toBeNull()
				expect(res).not.toBeNull()
				if (res && "error" in res) {
					expect(res.error.message).toBe("Fatal FS error")
				}
				done()
			},
		)
	})
})
