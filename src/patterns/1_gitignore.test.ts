import { ok } from "node:assert/strict"
import { test } from "bun:test"
import { gitignoreCompile } from "./gitignore.js"
import { patternMinimatchTest } from "./pattern.js"

test("gitignoreMatch", () => {
	ok(patternMinimatchTest(gitignoreCompile(".git"), ".git/message"))
	ok(!patternMinimatchTest(gitignoreCompile(".git"), ".github/message"))

	ok(patternMinimatchTest(gitignoreCompile("node_modules"), "node_modules/x/message.ts"))
	ok(patternMinimatchTest(gitignoreCompile("message"), ".git/message"))

	ok(patternMinimatchTest(gitignoreCompile("**/.git"), ".git/message"))
	ok(!patternMinimatchTest(gitignoreCompile("**/.git"), ".github/message"))

	ok(patternMinimatchTest(gitignoreCompile("/.git"), ".git/message"))
	ok(!patternMinimatchTest(gitignoreCompile("/.git"), ".github/message"))

	ok(!patternMinimatchTest(gitignoreCompile("/message"), ".git/message"))
	ok(!patternMinimatchTest(gitignoreCompile("/message"), ".git/message/file"))
	ok(patternMinimatchTest(gitignoreCompile("/message"), "message"))
	ok(patternMinimatchTest(gitignoreCompile("/message"), "message/file"))

	ok(patternMinimatchTest(gitignoreCompile(".git/"), ".git/message"))
	ok(patternMinimatchTest(gitignoreCompile(".git/"), ".git/message/file"))
	ok(patternMinimatchTest(gitignoreCompile(".git/"), ".git"))
	ok(!patternMinimatchTest(gitignoreCompile(".git/"), ".github/message"))
	ok(!patternMinimatchTest(gitignoreCompile(".git/"), ".github/message/file"))
	ok(!patternMinimatchTest(gitignoreCompile(".git/"), ".github"))
})
