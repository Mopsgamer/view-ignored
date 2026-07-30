import type { GlobRule } from "./index.js"

import { describe, test, expect } from "bun:test"

import { extractNpmignoreRules } from "./npmignore.js"
import { type Source } from "./source.js"

describe("npmignore parsing compliance", () => {
	function parse(content: string) {
		const source: Source = { inverted: false, path: ".npmignore", rules: [] }
		extractNpmignoreRules(source, Buffer.from(content))
		return source.rules as GlobRule[]
	}

	test("leading and trailing spaces are trimmed", () => {
		const rules = parse("  foo  ")
		expect(rules[0]?.excludes).toBeTrue()
		expect(rules[0]?.list).toContain("foo")
	})

	test("escaped spaces are also trimmed due to ignore-walk rule.trim()", () => {
		// Because ignore-walk does line.trim(), "foo\ " becomes "foo\"
		const rules = parse("foo\\ ")
		expect(rules[0]?.excludes).toBeTrue()
		expect(rules[0]?.list).toContain("foo\\")
	})

	test("lines starting with # after trimming are comments", () => {
		const rules = parse("  #foo")
		expect(rules).toHaveLength(0)

		const rules2 = parse("#comment")
		expect(rules2).toHaveLength(0)
	})

	test("negation with spaces around it is trimmed and resolved as negation", () => {
		const rules = parse("  !*.js  ")
		expect(rules[0]?.excludes).toBeFalse()
		expect(rules[0]?.list).toContain("*.js")
	})

	test("complex mixed case for npmignore", () => {
		const content = [
			"a",
			" b ", // matches "b", both leading and trailing spaces trimmed
			"c\\ ", // matches "c\", trailing space trimmed
			"  #d", // comment, skipped
			"# comment",
			"  !e ", // include "e", spaces trimmed
		].join("\n")

		const rules = parse(content)
		expect(rules).toHaveLength(4)
		expect(rules[3]?.excludes).toBeTrue()
		expect(rules[3]?.list).toContain("a")
		expect(rules[2]?.excludes).toBeTrue()
		expect(rules[2]?.list).toContain("b")
		expect(rules[1]?.excludes).toBeTrue()
		expect(rules[1]?.list).toContain("c\\")
		expect(rules[0]?.excludes).toBeFalse()
		expect(rules[0]?.list).toContain("e")
	})

	test("CRLF handling", () => {
		const rules = parse("foo\r\nbar\r")
		expect(rules[0]?.excludes).toBeTrue()
		expect(rules[0]?.list).toContain("foo")
		expect(rules[1]?.excludes).toBeTrue()
		expect(rules[1]?.list).toContain("bar")
	})
})
