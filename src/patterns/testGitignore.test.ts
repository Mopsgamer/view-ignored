import { describe, test, expect } from "bun:test"

import { extractGitignoreRules } from "./gitignore.js"
import { type Source } from "./source.js"

describe("gitignore parsing compliance", () => {
	function parse(content: string) {
		const source: Source = { inverted: false, path: ".gitignore", rules: [] }
		const { exclude, include } = extractGitignoreRules(source, Buffer.from(content))
		return { exclude: exclude.pattern, include: include.pattern }
	}

	test("leading spaces are preserved", () => {
		const { exclude } = parse("  foo")
		expect(exclude).toContain("  foo")
	})

	test("trailing spaces are trimmed if not escaped", () => {
		const { exclude } = parse("foo  ")
		expect(exclude).toContain("foo")
	})

	test("trailing spaces are preserved if escaped", () => {
		const { exclude } = parse("foo\\  ")
		expect(exclude).toContain("foo ")
	})

	test("only lines starting with # are comments", () => {
		const { exclude } = parse(" #foo")
		expect(exclude).toContain(" #foo")

		const { exclude: exclude2 } = parse("#comment")
		expect(exclude2).toHaveLength(0)
	})

	test("escaped # is not a comment", () => {
		const { exclude } = parse("\\#foo")
		expect(exclude).toContain("#foo")
	})

	test("negation with leading space", () => {
		const { include } = parse("! foo")
		expect(include).toContain(" foo")
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

		const { exclude, include } = parse(content)
		expect(exclude).toContain("a")
		expect(exclude).toContain(" b")
		expect(exclude).toContain("c ")
		expect(exclude).toContain(" #d")
		expect(include).toContain(" e")
	})

	test("CRLF handling", () => {
		const { exclude } = parse("foo\r\nbar\r")
		expect(exclude).toContain("foo")
		expect(exclude).toContain("bar")
	})

	test("multiple backslashes before trailing space", () => {
		const { exclude: exclude1 } = parse("foo\\\\ ") // escaped backslash, trailing space trimmed
		expect(exclude1).toContain("foo\\")

		const { exclude: exclude2 } = parse("foo\\\\\\ ") // escaped backslash + escaped space
		expect(exclude2).toContain("foo\\ ")
	})
})
