import { describe, test, expect } from "bun:test"

import { patternListCompile, patternCacheTest } from "./patternList.js"

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
})
