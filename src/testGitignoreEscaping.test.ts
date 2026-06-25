import type { Source } from "./patterns/source.js"

import { expect, test } from "bun:test"

import { extractGitignoreRules } from "./patterns/gitignore.js"

test("gitignore escaping - hash", () => {
	const source: Source = {
		inverted: false,
		path: ".gitignore",
		rules: [],
	}
	const content = Buffer.from("file\\#withhash")
	extractGitignoreRules(source, content)

	const patterns = source.rules.flatMap((r) => r.pattern)
	expect(patterns).toContain("file#withhash")
})

test("gitignore escaping - trailing space", () => {
	const source: Source = {
		inverted: false,
		path: ".gitignore",
		rules: [],
	}
	const content = Buffer.from("trailing\\ ")
	extractGitignoreRules(source, content)

	const patterns = source.rules.flatMap((r) => r.pattern)
	expect(patterns).toContain("trailing ")
})

test("gitignore escaping - hash and comment", () => {
	const source: Source = {
		inverted: false,
		path: ".gitignore",
		rules: [],
	}
	const content = Buffer.from("file\\#withhash # and comment")
	extractGitignoreRules(source, content)

	const patterns = source.rules.flatMap((r) => r.pattern)
	expect(patterns).toContain("file#withhash")
	expect(patterns).not.toContain("file#withhash # and comment")
})

test("gitignore UTF-8", () => {
	const source: Source = {
		inverted: false,
		path: ".gitignore",
		rules: [],
	}
	const content = Buffer.from("🚀.js")
	extractGitignoreRules(source, content)

	const patterns = source.rules.flatMap((r) => r.pattern)
	expect(patterns).toContain("🚀.js")
})

test("gitignore UTF-8 escaped space", () => {
	const source: Source = {
		inverted: false,
		path: ".gitignore",
		rules: [],
	}
	const content = Buffer.from("🚀\\ ")
	extractGitignoreRules(source, content)

	const patterns = source.rules.flatMap((r) => r.pattern)
	expect(patterns).toContain("🚀 ")
})
