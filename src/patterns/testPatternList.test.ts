import { describe, test, expect } from "bun:test"

import { patternListCompile } from "./patternList.js"

function patternCacheTest(compiled: { re: { test(str: string): boolean } }, str: string): boolean {
	return compiled.re.test(str)
}

describe(".gitignore patternListCompile", () => {
	test("stringCompile .git .git/message", () => {
		expect(patternCacheTest(patternListCompile({ list: [".git"] }), ".git/message")).toBeTrue()
	})
	test("stringCompile .git .Git/message nocase false", () => {
		expect(patternCacheTest(patternListCompile({ list: [".git"] }), ".Git/message")).toBeFalse()
	})
	test("stringCompile .git .Git/message nocase true", () => {
		expect(
			patternCacheTest(patternListCompile({ list: [".git"], nocase: true }), ".Git/message"),
		).toBeTrue()
	})
	test("stringCompile .git .github/message", () => {
		expect(patternCacheTest(patternListCompile({ list: [".git"] }), ".github/message")).toBeFalse()
	})

	test("stringCompile node_modules node_modules/x/message.ts", () => {
		expect(
			patternCacheTest(patternListCompile({ list: ["node_modules"] }), "node_modules/x/message.ts"),
		).toBeTrue()
	})
	test("stringCompile message .git/message", () => {
		expect(patternCacheTest(patternListCompile({ list: ["message"] }), ".git/message")).toBeTrue()
	})

	test("stringCompile **/.git .git/message", () => {
		expect(patternCacheTest(patternListCompile({ list: ["**/.git"] }), ".git/message")).toBeTrue()
	})
	test("stringCompile **/.git .github/message", () => {
		expect(
			patternCacheTest(patternListCompile({ list: ["**/.git"] }), ".github/message"),
		).toBeFalse()
	})

	test("stringCompile /.git .git/message", () => {
		expect(patternCacheTest(patternListCompile({ list: ["/.git"] }), ".git/message")).toBeTrue()
	})
	test("stringCompile /.git .github/message", () => {
		expect(patternCacheTest(patternListCompile({ list: ["/.git"] }), ".github/message")).toBeFalse()
	})

	test("stringCompile /message .git/message", () => {
		expect(patternCacheTest(patternListCompile({ list: ["/message"] }), ".git/message")).toBeFalse()
	})
	test("stringCompile /message .git/message/file", () => {
		expect(
			patternCacheTest(patternListCompile({ list: ["/message"] }), ".git/message/file"),
		).toBeFalse()
	})
	test("stringCompile /message message", () => {
		expect(patternCacheTest(patternListCompile({ list: ["/message"] }), "message")).toBeTrue()
	})
	test("stringCompile /message message/file", () => {
		expect(patternCacheTest(patternListCompile({ list: ["/message"] }), "message/file")).toBeTrue()
	})

	test("stringCompile .git/ .git/message", () => {
		expect(patternCacheTest(patternListCompile({ list: [".git/"] }), ".git/message")).toBeTrue()
	})
	test("stringCompile .git/ .git/message/file", () => {
		expect(
			patternCacheTest(patternListCompile({ list: [".git/"] }), ".git/message/file"),
		).toBeTrue()
	})
	test("stringCompile .git/ .git", () => {
		expect(patternCacheTest(patternListCompile({ list: [".git/"] }), ".git")).toBeTrue()
	})
	test("stringCompile .git/ .github/message", () => {
		expect(patternCacheTest(patternListCompile({ list: [".git/"] }), ".github/message")).toBeFalse()
	})
	test("stringCompile .git/ .github/message/file", () => {
		expect(
			patternCacheTest(patternListCompile({ list: [".git/"] }), ".github/message/file"),
		).toBeFalse()
	})
	test("stringCompile .git/ .github", () => {
		expect(patternCacheTest(patternListCompile({ list: [".git/"] }), ".github")).toBeFalse()
	})

	test("case-insensitive compilation preserves ASCII range casing like [A-\\]", () => {
		const list = ["[A-\\\\]"]
		const compiled = patternListCompile({ list, nocase: true })
		expect(patternCacheTest(compiled, "G")).toBeTrue()
		expect(patternCacheTest(compiled, "g")).toBeTrue()
		expect(patternCacheTest(compiled, "[")).toBeTrue()
		expect(patternCacheTest(compiled, "A")).toBeTrue()
		expect(patternCacheTest(compiled, "a")).toBeTrue()
	})
})
