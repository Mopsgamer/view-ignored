import type { Source } from "./source.js"

import { describe, expect, test } from "bun:test"

import { makeJsrJsonExtractor, makeJsrJsoncExtractor } from "./jsrjson.js"

describe("jsr.json", () => {
	const ext = makeJsrJsonExtractor("jsr.json")
	test("does not parse 0", () => {
		const source: Source = {
			inverted: false,
			path: "jsr.json",
			rules: [],
		}
		expect(ext.extract(source, 0 as any)).toBeInstanceOf(Error)
	})
	test("does not parse '{'", () => {
		const source: Source = {
			inverted: false,
			path: "jsr.json",
			rules: [],
		}
		expect(ext.extract(source, Buffer.from("{", "utf-8"))).toBeInstanceOf(Error)
	})
	test("parses '{}'", () => {
		const source: Source = {
			inverted: false,
			path: "jsr.json",
			rules: [],
		}
		expect(ext.extract(source, Buffer.from("{}", "utf-8"))).not.toBeInstanceOf(Error)
	})

	test("parses include and exclude", () => {
		const source: Source = {
			inverted: false,
			path: "jsr.json",
			rules: [],
		}
		const content = JSON.stringify({
			exclude: ["test"],
			include: ["src"],
		})
		expect(ext.extract(source, Buffer.from(content, "utf-8"))).toBeUndefined()
		expect(source.rules).toHaveLength(2)
		expect(source.rules[0]!.pattern).toContain("src")
		expect(source.rules[1]!.pattern).toContain("test")
	})

	test("parses publish override", () => {
		const source: Source = {
			inverted: false,
			path: "jsr.json",
			rules: [],
		}
		const content = JSON.stringify({
			publish: {
				exclude: ["dist/*.map"],
				include: ["dist"],
			},
		})
		expect(ext.extract(source, Buffer.from(content, "utf-8"))).toBeUndefined()
		expect(source.rules).toHaveLength(2)
		expect(source.rules[0]!.pattern).toContain("dist")
		expect(source.rules[1]!.pattern).toContain("dist/*.map")
	})
})

describe("jsr.jsonc", () => {
	const ext = makeJsrJsoncExtractor("jsr.jsonc")
	test("parses with comments", () => {
		const source: Source = {
			inverted: false,
			path: "jsr.jsonc",
			rules: [],
		}
		const content = `
		{
			// comment
			"include": ["src"]
		}
		`
		expect(ext.extract(source, Buffer.from(content, "utf-8"))).toBeUndefined()
		expect(source.rules).toHaveLength(2)
		expect(source.rules[0]!.pattern).toContain("src")
	})
})
