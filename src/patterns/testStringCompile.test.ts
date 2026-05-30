import { describe, expect, test } from "bun:test"

import { patternCompile } from "./patternCompile.js"
import { MatchMode, patternCacheTest } from "./patternMode.js"

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
				patternCompile(".git", undefined, MatchMode.unsensitive),
				".git/message",
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
		expect(patternCacheTest(cache, "a")).toBeTrue()
		const cacheW = patternCompile("+(a|b)", undefined, MatchMode.wildmatch)
		expect(patternCacheTest(cacheW, "a")).toBeFalse()
		expect(patternCacheTest(cacheW, "+(a|b)")).toBeTrue()
	})

	test("wildmatch mode case sensitivity", () => {
		const cache = patternCompile("A", undefined, MatchMode.wildmatch)
		expect(patternCacheTest(cache, "a")).toBeFalse()
		expect(patternCacheTest(cache, "A")).toBeTrue()

		const cacheI = patternCompile("A", undefined, MatchMode.wildmatch | MatchMode.unsensitive)
		expect(patternCacheTest(cacheI, "a")).toBeTrue()
		expect(patternCacheTest(cacheI, "A")).toBeTrue()
	})

	test("unsensitive mode", () => {
		const cache = patternCompile("a", undefined, MatchMode.unsensitive)
		expect(patternCacheTest(cache, "A")).toBeTrue() // "A" is lowercased because of nocase
		const cacheL = patternCompile("a", undefined, MatchMode.lowered)
		expect(patternCacheTest(cacheL, "A")).toBeFalse() // "A" is NOT lowercased because of MatchMode.lowered
		expect(patternCacheTest(cacheL, "a")).toBeTrue()
	})

	test("wildmatch mode (nobrace)", () => {
		const cache = patternCompile("{a,b}")
		// In micromatch with nobrace: true (which is our default), it should match literal "{a,b}"
		expect(patternCacheTest(cache, "a")).toBeFalse()
		expect(patternCacheTest(cache, "{a,b}")).toBeTrue()
		const cacheW = patternCompile("{a,b}", undefined, MatchMode.wildmatch)
		expect(patternCacheTest(cacheW, "a")).toBeFalse()
		expect(patternCacheTest(cacheW, "{a,b}")).toBeTrue()
	})

	test("normal mode default", () => {
		const cache = patternCompile("a")
		expect(patternCacheTest(cache, "a")).toBeTrue()
		expect(patternCacheTest(cache, "A")).toBeFalse()
		expect(patternCacheTest(cache, "a")).toBeTrue()
		expect(patternCacheTest(cache, "A")).toBeFalse()
	})
})
