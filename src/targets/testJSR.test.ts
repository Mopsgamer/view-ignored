import type { NestedDirectoryJSON } from "memfs"

import { describe, test } from "bun:test"

import { testScan, type PathHandlerOptions } from "../testScan.test.js"
import { JSR as target } from "./jsr.js"

async function testJSR(
	done: () => void,
	tree: NestedDirectoryJSON,
	handler: ((o: PathHandlerOptions) => void | Promise<void>) | string[],
) {
	try {
		await testScan(done, tree, handler, { target })
	} catch (error) {
		throw new Error("Error while testing JSR", { cause: error })
	}
}

const jsrJson = JSON.stringify({
	exports: "./mod.ts",
	name: "jsr-test",
	version: "1.0.0",
})

describe("JSR", () => {
	test("includes jsr.json and exports", async (done) => {
		await testJSR(done, { "jsr.json": jsrJson, "mod.ts": "", "other.ts": "" }, [
			"jsr.json",
			"mod.ts",
			"other.ts",
		])
	})
})
