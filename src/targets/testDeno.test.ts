import { describe, test, expect } from "bun:test"

import { testScan } from "../testScan.test.js"
import { makeDeno } from "./deno.js"

const denoJson = JSON.stringify({
	exports: ".",
	name: "deno-test",
	version: "1.0.0",
})

describe("Deno", () => {
	test("includes deno.json", async (done) => {
		await testScan(done, { "deno.json": denoJson, "main.ts": "" }, ["deno.json", "main.ts"], {
			target: makeDeno(),
		})
	})

	test("throws an error if package.json is invalid", async (done) => {
		expect(() =>
			testScan(done, { "package.json": "{ invalid json }" }, () => {}, { target: makeDeno() }),
		).toThrow()
		expect(() =>
			testScan(done, { "package.json": "{}" }, () => {}, { target: makeDeno() }),
		).toThrow()
		expect(() =>
			testScan(done, { "package.json": '{ "name": 0, "version": 0 }' }, () => {}, {
				target: makeDeno(),
			}),
		).toThrow()
	})
	test("throws an error if deno.json is invalid", async (done) => {
		expect(() =>
			testScan(done, { "deno.json": "{ invalid json }" }, () => {}, { target: makeDeno() }),
		).toThrow()
		expect(() => testScan(done, { "deno.json": "{}" }, () => {}, { target: makeDeno() })).toThrow()
		expect(() =>
			testScan(done, { "deno.json": '{ "name": 0, "version": 0 }' }, () => {}, {
				target: makeDeno(),
			}),
		).toThrow()
	})
	test("ignores package.json if valid deno.json exists", async (done) => {
		expect(() =>
			testScan(
				done,
				{ "deno.json": denoJson, "package.json": '{ "name": 0, "version": 0 }' },
				() => {},
				{ target: makeDeno() },
			),
		).not.toThrow()
	})
})
