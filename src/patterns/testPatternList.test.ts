import { describe, test, expect } from "bun:test"

import { patternListCompile, PatternSpec } from "./patternList.js"

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
})
