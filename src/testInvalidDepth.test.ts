import { describe, test, expect } from "bun:test"

import { scan } from "./scan.js"
import { Git } from "./targets/git.js"

describe("Git", () => {
	const signal = AbortSignal.timeout(0)
	test("depth -1 should throw", async () => {
		expect(() => scan({ depth: -1, signal, target: Git })).toThrow({
			message: "Depth must be a non-negative integer",
			name: "TypeError",
		})
	})

	test("depth 0 should not throw", async () => {
		expect(() => scan({ depth: 0, target: Git })).not.toThrow()
	})

	test("depth 1 should not throw", async () => {
		expect(() => scan({ depth: 1, target: Git })).not.toThrow()
	})
})
