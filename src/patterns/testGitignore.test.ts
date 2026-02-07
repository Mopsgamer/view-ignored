import { describe, test, expect } from "bun:test"
import { gitignoreCompile } from "./gitignore.js"
import { patternMinimatchTest } from "./pattern.js"

describe("Gitignore", () => {
	test("gitignoreCompile", () => {
		expect(patternMinimatchTest(gitignoreCompile(".git"), ".git/message")).toBeTrue()
		expect(patternMinimatchTest(gitignoreCompile(".git"), ".github/message")).toBeFalse()

		expect(
			patternMinimatchTest(gitignoreCompile("node_modules"), "node_modules/x/message.ts"),
		).toBeTrue()
		expect(patternMinimatchTest(gitignoreCompile("message"), ".git/message")).toBeTrue()

		expect(patternMinimatchTest(gitignoreCompile("**/.git"), ".git/message")).toBeTrue()
		expect(patternMinimatchTest(gitignoreCompile("**/.git"), ".github/message")).toBeFalse()

		expect(patternMinimatchTest(gitignoreCompile("/.git"), ".git/message")).toBeTrue()
		expect(patternMinimatchTest(gitignoreCompile("/.git"), ".github/message")).toBeFalse()

		expect(patternMinimatchTest(gitignoreCompile("/message"), ".git/message")).toBeFalse()
		expect(patternMinimatchTest(gitignoreCompile("/message"), ".git/message/file")).toBeFalse()
		expect(patternMinimatchTest(gitignoreCompile("/message"), "message")).toBeTrue()
		expect(patternMinimatchTest(gitignoreCompile("/message"), "message/file")).toBeTrue()

		expect(patternMinimatchTest(gitignoreCompile(".git/"), ".git/message")).toBeTrue()
		expect(patternMinimatchTest(gitignoreCompile(".git/"), ".git/message/file")).toBeTrue()
		expect(patternMinimatchTest(gitignoreCompile(".git/"), ".git")).toBeTrue()
		expect(patternMinimatchTest(gitignoreCompile(".git/"), ".github/message")).toBeFalse()
		expect(patternMinimatchTest(gitignoreCompile(".git/"), ".github/message/file")).toBeFalse()
		expect(patternMinimatchTest(gitignoreCompile(".git/"), ".github")).toBeFalse()
	})
})
