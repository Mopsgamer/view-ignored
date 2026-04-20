import { describe, test, expect } from "bun:test"

import type { Source } from "./source.js"

import { extractJsrJson } from "./jsrjson.js"

describe("jsr.json", () => {
	test("does not parse 0", () => {
		const source: Source = {
			inverted: false,
			name: "jsr.json",
			path: "jsr.json",
			rules: [],
		}
		// @ts-expect-error for 0
		expect(() => extractJsrJson(source, 0)).toThrowError("Invalid")
	})
	test("does not parse '{'", () => {
		const source: Source = {
			inverted: false,
			name: "jsr.json",
			path: "jsr.json",
			rules: [],
		}
		expect(() => extractJsrJson(source, new Buffer("{", "utf-8"))).toThrowError("Invalid")
	})
	test("parses '{}'", () => {
		const source: Source = {
			inverted: false,
			name: "jsr.json",
			path: "jsr.json",
			rules: [],
		}
		expect(() => extractJsrJson(source, new Buffer("{}", "utf-8"))).not.toThrowError()
	})
})
