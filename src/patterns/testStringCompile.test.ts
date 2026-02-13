import { describe, test, expect } from "bun:test"

import { patternMinimatchTest } from "./pattern.js"
import { stringCompile } from "./stringCompile.js"

describe(".gitignore", () => {
	test("stringCompile", () => {
		expect(patternMinimatchTest(stringCompile(".git"), ".git/message")).toBeTrue()
		expect(patternMinimatchTest(stringCompile(".git"), ".Git/message")).toBeTrue()
		expect(patternMinimatchTest(stringCompile(".git"), ".github/message")).toBeFalse()

		expect(
			patternMinimatchTest(stringCompile("node_modules"), "node_modules/x/message.ts"),
		).toBeTrue()
		expect(patternMinimatchTest(stringCompile("message"), ".git/message")).toBeTrue()

		expect(patternMinimatchTest(stringCompile("**/.git"), ".git/message")).toBeTrue()
		expect(patternMinimatchTest(stringCompile("**/.git"), ".github/message")).toBeFalse()

		expect(patternMinimatchTest(stringCompile("/.git"), ".git/message")).toBeTrue()
		expect(patternMinimatchTest(stringCompile("/.git"), ".github/message")).toBeFalse()

		expect(patternMinimatchTest(stringCompile("/message"), ".git/message")).toBeFalse()
		expect(patternMinimatchTest(stringCompile("/message"), ".git/message/file")).toBeFalse()
		expect(patternMinimatchTest(stringCompile("/message"), "message")).toBeTrue()
		expect(patternMinimatchTest(stringCompile("/message"), "message/file")).toBeTrue()

		expect(patternMinimatchTest(stringCompile(".git/"), ".git/message")).toBeTrue()
		expect(patternMinimatchTest(stringCompile(".git/"), ".git/message/file")).toBeTrue()
		expect(patternMinimatchTest(stringCompile(".git/"), ".git")).toBeTrue()
		expect(patternMinimatchTest(stringCompile(".git/"), ".github/message")).toBeFalse()
		expect(patternMinimatchTest(stringCompile(".git/"), ".github/message/file")).toBeFalse()
		expect(patternMinimatchTest(stringCompile(".git/"), ".github")).toBeFalse()
	})
})
