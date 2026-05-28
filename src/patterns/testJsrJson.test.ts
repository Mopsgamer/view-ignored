import type { Source } from "./source.js"

import { describe, expect, test } from "bun:test"

import { makeJsrJsonExtractor } from "./jsrjson.js"

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
})
