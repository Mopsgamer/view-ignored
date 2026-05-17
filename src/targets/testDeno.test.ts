import type { NestedDirectoryJSON } from "memfs"

import { describe, test, expect } from "bun:test"

import { testScan, type PathHandlerOptions } from "../testScan.test.js"
import { Deno as target } from "./deno.js"

async function testDeno(
	done: () => void,
	tree: NestedDirectoryJSON,
	handler: ((o: PathHandlerOptions) => void | Promise<void>) | string[],
) {
	try {
		await testScan(done, tree, handler, { target })
	} catch (error) {
		throw new Error("Error while testing Deno", { cause: error })
	}
}

const denoJson = JSON.stringify({
	exports: ".",
	name: "deno-test",
	version: "1.0.0",
})

describe("Deno", () => {
	test("includes deno.json", async (done) => {
		await testDeno(done, { "deno.json": denoJson, "main.ts": "" }, ["deno.json", "main.ts"])
	})

	test("throws an error if package.json is invalid", async (done) => {
		expect(() => testDeno(done, { "package.json": "{ invalid json }" }, () => {})).toThrow()
		expect(() => testDeno(done, { "package.json": "{}" }, () => {})).toThrow()
		expect(() =>
			testDeno(done, { "package.json": '{ "name": 0, "version": 0 }' }, () => {}),
		).toThrow()
	})
	test("throws an error if deno.json is invalid", async (done) => {
		expect(() => testDeno(done, { "deno.json": "{ invalid json }" }, () => {})).toThrow()
		expect(() => testDeno(done, { "deno.json": "{}" }, () => {})).toThrow()
		expect(() => testDeno(done, { "deno.json": '{ "name": 0, "version": 0 }' }, () => {})).toThrow()
	})
	test("ignores package.json if valid deno.json exists", async (done) => {
		expect(() =>
			testDeno(
				done,
				{ "deno.json": denoJson, "package.json": '{ "name": 0, "version": 0 }' },
				() => {},
			),
		).not.toThrow()
	})
})
