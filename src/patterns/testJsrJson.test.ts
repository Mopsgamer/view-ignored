import type { Source } from "./source.js"

import { describe, test, expect } from "bun:test"

import { extractJsrJson } from "./jsrjson.js"

describe("jsr.json", () => {
	test("does not parse 0", () => {
		const source: Source = {
			inverted: false,
			path: "jsr.json",
			rules: [],
		}
		// @ts-expect-error for 0
		expect(extractJsrJson(source, 0)).toBeInstanceOf(Error)
	})
	test("does not parse '{'", () => {
		const source: Source = {
			inverted: false,
			path: "jsr.json",
			rules: [],
		}
		expect(extractJsrJson(source, Buffer.from("{", "utf-8"))).toBeInstanceOf(Error)
	})
	test("parses '{}'", () => {
		const source: Source = {
			inverted: false,
			path: "jsr.json",
			rules: [],
		}
		expect(extractJsrJson(source, Buffer.from("{}", "utf-8"))).not.toBeInstanceOf(Error)
	})
})
