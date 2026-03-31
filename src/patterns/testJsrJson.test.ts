import { describe, test, expect } from "bun:test"

import type { MatcherContext, Resource } from "./matcherContext.js"
import type { RuleMatch } from "./rule.js"
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
		const ctx: MatcherContext = {
			paths: new Map<string, RuleMatch>(),
			external: new Map<string, Resource>(),
			failed: [],
			depthPaths: new Map<string, number>(),
			totalFiles: 0,
			totalMatchedFiles: 0,
			totalDirs: 0,
		}
		// @ts-expect-error for 0
		expect(() => extractJsrJson(source, 0, ctx)).not.toThrowError()
		expect(ctx.failed[0]?.error?.message).toMatch(
			"Invalid 'jsr.json': must be an object (was a number)",
		)
	})
	test("does not parse '{'", () => {
		const source: Source = {
			inverted: false,
			name: "jsr.json",
			path: "jsr.json",
			rules: [],
		}
		expect(() => extractJsrJson(source, new Buffer("{", "utf-8"))).toThrowError("Expected")
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
