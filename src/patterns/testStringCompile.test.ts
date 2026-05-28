import { describe, test, expect } from "bun:test"

import { patternCompile } from "./patternCompile.js"
import { patternCacheTest, MatchMode } from "./patternList.js"

describe(".gitignore", () => {
	test("stringCompile .git .git/message", () => {
		expect(patternCacheTest(patternCompile(".git"), ".git/message")).toBeTrue()
	})
	test("stringCompile .git .Git/message nocase false", () => {
		expect(patternCacheTest(patternCompile(".git"), ".Git/message")).toBeFalse()
	})
	test("stringCompile .git .Git/message nocase true", () => {
		expect(
			patternCacheTest(
				patternCompile(".git", undefined, { nocase: true }),
				".git/message",
				MatchMode.unsensitive,
			),
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

	test("wildmatch mode (noextglob)", () => {
		const cache = patternCompile("+(a|b)")
		// In normal mode, micromatch handles extglobs
		expect(patternCacheTest(cache, "a")).toBeTrue()
		// In wildmatch mode, noextglob is true, so it shouldn't match "a" as an extglob
		expect(patternCacheTest(cache, "a", MatchMode.wildmatch)).toBeFalse()
		// But it should match literal "+(a|b)"
		expect(patternCacheTest(cache, "+(a|b)", MatchMode.wildmatch)).toBeTrue()
	})

	test("wildmatch mode case sensitivity", () => {
		const cache = patternCompile("A")
		expect(patternCacheTest(cache, "a", MatchMode.wildmatch)).toBeFalse()
		expect(patternCacheTest(cache, "A", MatchMode.wildmatch)).toBeTrue()

		const cacheI = patternCompile("A", undefined, { nocase: true })
		expect(patternCacheTest(cacheI, "a", MatchMode.wildmatch)).toBeTrue()
		expect(patternCacheTest(cacheI, "A", MatchMode.wildmatch)).toBeTrue()
	})

	test("unsensitive mode", () => {
		const cache = patternCompile("a", undefined, { nocase: true })
		expect(patternCacheTest(cache, "A", MatchMode.unsensitive)).toBeFalse() // "A" is not lowercased
		expect(patternCacheTest(cache, "a", MatchMode.unsensitive)).toBeTrue()
	})

	test("wildmatch mode (nobrace)", () => {
		const cache = patternCompile("{a,b}")
		// In micromatch with nobrace: true (which is our default), it should match literal "{a,b}"
		expect(patternCacheTest(cache, "a")).toBeFalse()
		expect(patternCacheTest(cache, "{a,b}")).toBeTrue()
		expect(patternCacheTest(cache, "a", MatchMode.wildmatch)).toBeFalse()
		expect(patternCacheTest(cache, "{a,b}", MatchMode.wildmatch)).toBeTrue()
	})

	test("normal mode default", () => {
		const cache = patternCompile("a")
		expect(patternCacheTest(cache, "a")).toBeTrue()
		expect(patternCacheTest(cache, "A")).toBeFalse()
		expect(patternCacheTest(cache, "a", MatchMode.normal)).toBeTrue()
		expect(patternCacheTest(cache, "A", MatchMode.normal)).toBeFalse()
	})
})
