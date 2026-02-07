import { describe, test, expect } from "bun:test"
import { scan } from "./scan.js"
import { Git } from "./targets/git.js"

describe("Git", () => {
	const signal = AbortSignal.timeout(50)
	test("depth -1 should throw", async () => {
		expect(() => scan({ target: Git, depth: -1, signal })).toThrow({
			name: "TypeError",
			message: "Depth must be a non-negative integer",
		})
	})

	test("depth 0 should not throw", async () => {
		expect(scan({ target: Git, depth: 0, signal })).rejects.toMatchObject({
			name: "TimeoutError",
		})
	})

	test("depth 1 should not throw", async () => {
		expect(scan({ target: Git, depth: 1, signal })).rejects.toMatchObject({
			name: "TimeoutError",
		})
	})
})
