import { describe, test, expect } from "bun:test"

import { extractGitignoreRules } from "./gitignore.js"
import { type Source } from "./source.js"

describe("gitignore parsing compliance", () => {
	function parse(content: string) {
		const source: Source = { inverted: false, path: ".gitignore", rules: [] }
		extractGitignoreRules(source, Buffer.from(content))
		return source.rules
	}

	test("leading spaces are preserved", () => {
		const rules = parse("  foo")
		expect(rules[0]?.excludes).toBeTrue()
		expect(rules[0]?.pattern).toContain("  foo")
	})

	test("trailing spaces are trimmed if not escaped", () => {
		const rules = parse("foo  ")
		expect(rules[0]?.excludes).toBeTrue()
		expect(rules[0]?.pattern).toContain("foo")
	})

	test("trailing spaces are preserved if escaped", () => {
		const rules = parse("foo\\ ")
		expect(rules[0]?.excludes).toBeTrue()
		expect(rules[0]?.pattern).toContain("foo ")
	})

	test("only lines starting with # are comments", () => {
		const rules = parse(" #foo")
		expect(rules[0]?.excludes).toBeTrue()
		expect(rules[0]?.pattern).toContain(" #foo")

		const rules2 = parse("#comment")
		expect(rules2).toHaveLength(0)
	})

	test("escaped # is not a comment", () => {
		const rules = parse("\\#foo")
		expect(rules[0]?.excludes).toBeTrue()
		expect(rules[0]?.pattern).toContain("#foo")
	})

	test("gitignore escaping - hash and comment", () => {
		const rules = parse("file\\#withhash # and comment")
		expect(rules[0]?.excludes).toBeTrue()
		expect(rules[0]?.pattern).toContain("file#withhash")
		expect(rules[0]?.pattern).not.toContain("file#withhash # and comment")
	})

	test("negation with leading space", () => {
		const rules = parse("! foo")
		expect(rules[0]?.excludes).toBeFalse()
		expect(rules[0]?.pattern).toContain(" foo")
	})

	test("complex mixed case", () => {
		const content = [
			"a",
			" b ", // matches " b", trailing space trimmed
			"c\\ ", // matches "c ", trailing space escaped
			"\\ #d", // matches " #d", leading space and hash preserved
			"# comment",
			"! e", // include " e"
		].join("\n")

		const rules = parse(content)
		expect(rules[4]?.excludes).toBeTrue()
		expect(rules[4]?.pattern).toContain("a")
		expect(rules[3]?.excludes).toBeTrue()
		expect(rules[3]?.pattern).toContain(" b")
		expect(rules[2]?.excludes).toBeTrue()
		expect(rules[2]?.pattern).toContain("c ")
		expect(rules[1]?.excludes).toBeTrue()
		expect(rules[1]?.pattern).toContain(" #d")
		expect(rules[0]?.excludes).toBeFalse()
		expect(rules[0]?.pattern).toContain(" e")
	})

	test("CRLF handling", () => {
		const rules = parse("foo\r\nbar\r")
		expect(rules[0]?.excludes).toBeTrue()
		expect(rules[0]?.pattern).toContain("foo")
		expect(rules[1]?.excludes).toBeTrue()
		expect(rules[1]?.pattern).toContain("bar")
	})

	test("multiple backslashes before trailing space", () => {
		const rules = parse("foo\\\\ ") // escaped backslash, trailing space trimmed
		expect(rules[0]?.excludes).toBeTrue()
		expect(rules[0]?.pattern).toContain("foo\\")

		const rules2 = parse("foo\\\\\\ ") // escaped backslash + escaped space
		expect(rules2[0]?.excludes).toBeTrue()
		expect(rules2[0]?.pattern).toContain("foo\\ ")
	})

	test("gitignore UTF-8", () => {
		const rules = parse("🚀.js")
		expect(rules[0]?.excludes).toBeTrue()
		expect(rules[0]?.pattern).toContain("🚀.js")
	})

	test("gitignore UTF-8 escaped space", () => {
		const rules = parse("🚀\\ ")
		expect(rules[0]?.excludes).toBeTrue()
		expect(rules[0]?.pattern).toContain("🚀 ")
	})
})
