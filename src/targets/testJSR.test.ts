import type { NestedDirectoryJSON } from "memfs"

import { describe, test } from "bun:test"

import { testScan, type PathHandlerOptions } from "../testScan.test.js"
import { JSR as target } from "./jsr.js"

function testJsr(
	done: () => void,
	tree: NestedDirectoryJSON,
	handler: ((o: PathHandlerOptions) => void | Promise<void>) | string[],
) {
	return testScan(done, tree, handler, { target })
}

const jsrJson = JSON.stringify({
	exports: "./mod.ts",
	name: "jsr-test",
	version: "1.0.0",
})

describe("JSR", () => {
	test("includes jsr.json and exports", async (done) => {
		await testJsr(done, { "jsr.json": jsrJson, "mod.ts": "", "other.ts": "" }, [
			"jsr.json",
			"mod.ts",
			"other.ts",
		])
	})
})
