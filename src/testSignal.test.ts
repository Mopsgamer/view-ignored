import { describe, test, expect } from "bun:test"

import { scan } from "./scan.js"
import { makeGit } from "./targets/git.js"

describe("signal option", () => {
	// We can't easily test AbortSignal with testScan because it's async and depends on timing.
	// But we can try to use a signal that is already aborted.

	test("aborted signal should throw", async () => {
		const controller = new AbortController()
		controller.abort("reason")
		const signal = controller.signal

		// resolveSources.ts returns signal.reason as error
		expect(scan({ signal, target: makeGit() })).rejects.toBe("reason")
	})
})
