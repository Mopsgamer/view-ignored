import { describe, test, expect } from "bun:test"

import { patternMinimatchTest } from "./pattern.js"
import { stringCompile } from "./stringCompile.js"

describe(".gitignore", () => {
	test("stringCompile .git .git/message", () => {
		expect(patternMinimatchTest(stringCompile(".git"), ".git/message")).toBeTrue()
	})
	test("stringCompile .git .Git/message nocase false", () => {
		expect(patternMinimatchTest(stringCompile(".git"), ".Git/message")).toBeFalse()
	})
	test("stringCompile .git .Git/message nocase true", () => {
		expect(
			patternMinimatchTest(stringCompile(".git", undefined, { nocase: true }), ".Git/message"),
		).toBeTrue()
	})
	test("stringCompile .git .github/message", () => {
		expect(patternMinimatchTest(stringCompile(".git"), ".github/message")).toBeFalse()
	})

	test("stringCompile node_modules node_modules/x/message.ts", () => {
		expect(
			patternMinimatchTest(stringCompile("node_modules"), "node_modules/x/message.ts"),
		).toBeTrue()
	})
	test("stringCompile message .git/message", () => {
		expect(patternMinimatchTest(stringCompile("message"), ".git/message")).toBeTrue()
	})

	test("stringCompile **/.git .git/message", () => {
		expect(patternMinimatchTest(stringCompile("**/.git"), ".git/message")).toBeTrue()
	})
	test("stringCompile **/.git .github/message", () => {
		expect(patternMinimatchTest(stringCompile("**/.git"), ".github/message")).toBeFalse()
	})

	test("stringCompile /.git .git/message", () => {
		expect(patternMinimatchTest(stringCompile("/.git"), ".git/message")).toBeTrue()
	})
	test("stringCompile /.git .github/message", () => {
		expect(patternMinimatchTest(stringCompile("/.git"), ".github/message")).toBeFalse()
	})

	test("stringCompile /message .git/message", () => {
		expect(patternMinimatchTest(stringCompile("/message"), ".git/message")).toBeFalse()
	})
	test("stringCompile /message .git/message/file", () => {
		expect(patternMinimatchTest(stringCompile("/message"), ".git/message/file")).toBeFalse()
	})
	test("stringCompile /message message", () => {
		expect(patternMinimatchTest(stringCompile("/message"), "message")).toBeTrue()
	})
	test("stringCompile /message message/file", () => {
		expect(patternMinimatchTest(stringCompile("/message"), "message/file")).toBeTrue()
	})

	test("stringCompile .git/ .git/message", () => {
		expect(patternMinimatchTest(stringCompile(".git/"), ".git/message")).toBeTrue()
	})
	test("stringCompile .git/ .git/message/file", () => {
		expect(patternMinimatchTest(stringCompile(".git/"), ".git/message/file")).toBeTrue()
	})
	test("stringCompile .git/ .git", () => {
		expect(patternMinimatchTest(stringCompile(".git/"), ".git")).toBeTrue()
	})
	test("stringCompile .git/ .github/message", () => {
		expect(patternMinimatchTest(stringCompile(".git/"), ".github/message")).toBeFalse()
	})
	test("stringCompile .git/ .github/message/file", () => {
		expect(patternMinimatchTest(stringCompile(".git/"), ".github/message/file")).toBeFalse()
	})
	test("stringCompile .git/ .github", () => {
		expect(patternMinimatchTest(stringCompile(".git/"), ".github")).toBeFalse()
	})
})
