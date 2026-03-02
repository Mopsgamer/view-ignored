import { describe, test, expect } from "bun:test"

import { patternCompile } from "./patternCompile.js"
import { patternCacheTest } from "./patternList.js"

describe(".gitignore", () => {
	test("stringCompile .git .git/message", () => {
		expect(patternCacheTest(patternCompile(".git"), ".git/message")).toBeTrue()
	})
	test("stringCompile .git .Git/message nocase false", () => {
		expect(patternCacheTest(patternCompile(".git"), ".Git/message")).toBeFalse()
	})
	test("stringCompile .git .Git/message nocase true", () => {
		expect(
			patternCacheTest(patternCompile(".git", undefined, { nocase: true }), ".Git/message"),
		).toBeTrue()
	})
	test("stringCompile .git .github/message", () => {
		expect(patternCacheTest(patternCompile(".git"), ".github/message")).toBeFalse()
	})

	test("stringCompile node_modules node_modules/x/message.ts", () => {
		expect(patternCacheTest(patternCompile("node_modules"), "node_modules/x/message.ts")).toBeTrue()
	})
	test("stringCompile message .git/message", () => {
		expect(patternCacheTest(patternCompile("message"), ".git/message")).toBeTrue()
	})

	test("stringCompile **/.git .git/message", () => {
		expect(patternCacheTest(patternCompile("**/.git"), ".git/message")).toBeTrue()
	})
	test("stringCompile **/.git .github/message", () => {
		expect(patternCacheTest(patternCompile("**/.git"), ".github/message")).toBeFalse()
	})

	test("stringCompile /.git .git/message", () => {
		expect(patternCacheTest(patternCompile("/.git"), ".git/message")).toBeTrue()
	})
	test("stringCompile /.git .github/message", () => {
		expect(patternCacheTest(patternCompile("/.git"), ".github/message")).toBeFalse()
	})

	test("stringCompile /message .git/message", () => {
		expect(patternCacheTest(patternCompile("/message"), ".git/message")).toBeFalse()
	})
	test("stringCompile /message .git/message/file", () => {
		expect(patternCacheTest(patternCompile("/message"), ".git/message/file")).toBeFalse()
	})
	test("stringCompile /message message", () => {
		expect(patternCacheTest(patternCompile("/message"), "message")).toBeTrue()
	})
	test("stringCompile /message message/file", () => {
		expect(patternCacheTest(patternCompile("/message"), "message/file")).toBeTrue()
	})

	test("stringCompile .git/ .git/message", () => {
		expect(patternCacheTest(patternCompile(".git/"), ".git/message")).toBeTrue()
	})
	test("stringCompile .git/ .git/message/file", () => {
		expect(patternCacheTest(patternCompile(".git/"), ".git/message/file")).toBeTrue()
	})
	test("stringCompile .git/ .git", () => {
		expect(patternCacheTest(patternCompile(".git/"), ".git")).toBeTrue()
	})
	test("stringCompile .git/ .github/message", () => {
		expect(patternCacheTest(patternCompile(".git/"), ".github/message")).toBeFalse()
	})
	test("stringCompile .git/ .github/message/file", () => {
		expect(patternCacheTest(patternCompile(".git/"), ".github/message/file")).toBeFalse()
	})
	test("stringCompile .git/ .github", () => {
		expect(patternCacheTest(patternCompile(".git/"), ".github")).toBeFalse()
	})
})
