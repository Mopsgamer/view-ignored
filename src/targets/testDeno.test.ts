import type { NestedDirectoryJSON } from "memfs"
import { describe, test } from "bun:test"
import { testScan, type PathHandlerOptions } from "../testScan.test.js"
import { Deno as target } from "./deno.js"

function testDeno(
	done: () => void,
	tree: NestedDirectoryJSON,
	handler: ((o: PathHandlerOptions) => void | Promise<void>) | string[],
) {
	return testScan(done, tree, handler, { target })
}

const denoJson = JSON.stringify({
	name: "deno-test",
	version: "1.0.0",
	exports: "."
})

describe("Deno", () => {
	test("includes deno.json", async (done) => {
		await testDeno(done, { "deno.json": denoJson, "main.ts": "" }, ["deno.json", "main.ts"])
	})
})
