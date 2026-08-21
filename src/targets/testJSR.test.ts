import { describe, test, expect } from "bun:test"

import { testScan } from "../testScan.test.js"
import { makeJSR } from "./jsr.js"
import { jsrManifestParse, makeJsrInit } from "./jsrManifest.js"

const jsrJson = JSON.stringify({
	exports: "./mod.ts",
	name: "jsr-test",
	version: "1.0.0",
})

describe("JSR", () => {
	test("includes jsr.json and exports", async (done) => {
		await testScan(
			done,
			{ "jsr.json": jsrJson, "mod.ts": "", "other.ts": "" },
			["jsr.json", "mod.ts", "other.ts"],
			{ target: makeJSR() },
		)
	})
	const validJsrJson = JSON.stringify({
		exports: "./mod.ts",
		name: "@scope/pkg",
		version: "1.0.0",
	})
	const invalidPackageJson = '{ "name": 0, "version": 0 }'
	test("ignores package.json if valid jsr.json exists", async (done) => {
		expect(() =>
			testScan(done, { "jsr.json": validJsrJson, "package.json": invalidPackageJson }, () => {}, {
				target: makeJSR(),
			}),
		).not.toThrow()
	})

	describe("jsrManifestParse logic", () => {
		test("successfully parses basic valid JSR manifest", () => {
			const parsed = jsrManifestParse(validJsrJson)
			expect(parsed.name).toBe("@scope/pkg")
			expect(parsed.version).toBe("1.0.0")
		})

		test("successfully parses top-level include and exclude fields", () => {
			const json = JSON.stringify({
				exclude: ["src/**/*.test.ts", "**/dist"],
				exports: "./mod.ts",
				include: ["src/**/*.ts", "README.md"],
				name: "@scope/pkg",
				version: "1.0.0",
			})

			const parsed = jsrManifestParse(json)
			expect(parsed.include).toEqual(["src/**/*.ts", "README.md"])
			expect(parsed.exclude).toEqual(["src/**/*.test.ts", "**/dist"])
		})

		test("successfully parses publish override configurations", () => {
			const json = JSON.stringify({
				exports: "./mod.ts",
				name: "@scope/pkg",
				publish: {
					exclude: ["dist/**/*.map"],
					include: ["dist/**/*"],
				},
				version: "1.0.0",
			})

			const parsed = jsrManifestParse(json)
			expect(parsed.publish?.include).toEqual(["dist/**/*"])
			expect(parsed.publish?.exclude).toEqual(["dist/**/*.map"])
		})

		test("throws error if top-level include or exclude are not string arrays", () => {
			const invalidInclude = JSON.stringify({
				exports: "./mod.ts",
				include: "src/**/*.ts", // Should be an array
				name: "@scope/pkg",
				version: "1.0.0",
			})

			expect(() => jsrManifestParse(invalidInclude)).toThrow(
				"'include' field must be an array of strings",
			)

			const invalidExclude = JSON.stringify({
				exclude: 123,
				exports: "./mod.ts",
				name: "@scope/pkg",
				version: "1.0.0",
			})

			expect(() => jsrManifestParse(invalidExclude)).toThrow(
				"'exclude' field must be an array of strings",
			)
		})

		test("throws error if publish blocks have invalid types", () => {
			const invalidPublish = JSON.stringify({
				exports: "./mod.ts",
				name: "@scope/pkg",
				publish: {
					include: "dist/**/*", // Should be an array
				},
				version: "1.0.0",
			})

			expect(() => jsrManifestParse(invalidPublish)).toThrow(
				"'publish.include' field must be an array of strings",
			)

			const invalidPublishExclude = JSON.stringify({
				exports: "./mod.ts",
				name: "@scope/pkg",
				publish: {
					exclude: 123,
				},
				version: "1.0.0",
			})

			expect(() => jsrManifestParse(invalidPublishExclude)).toThrow(
				"'publish.exclude' field must be an array of strings",
			)

			const invalidPublishNotObj = JSON.stringify({
				exports: "./mod.ts",
				name: "@scope/pkg",
				publish: "invalid",
				version: "1.0.0",
			})

			expect(() => jsrManifestParse(invalidPublishNotObj)).toThrow(
				"'publish' field must be an object",
			)
		})

		test("throws error if required fields are missing or non-object root", () => {
			expect(() => jsrManifestParse("null")).toThrow("JSR manifest must be a JSON object")

			const missingFields = JSON.stringify({
				name: "@scope/pkg",
			})

			expect(() => jsrManifestParse(missingFields)).toThrow(
				"Missing or invalid 'version' in manifest",
			)

			const invalidExports = JSON.stringify({
				exports: 123,
				name: "@scope/pkg",
				version: "1.0.0",
			})

			expect(() => jsrManifestParse(invalidExports)).toThrow(
				"Missing or invalid 'exports' in manifest",
			)
		})

		test("makeJsrInit with no extractors", (done) => {
			const init = makeJsrInit("TestJSR", [])
			// oxlint-disable-next-line typescript/no-explicit-any
			init({ cwd: ".", fs: {} as any, signal: null, target: {} as any }, (err) => {
				expect(err).toBeInstanceOf(Error)
				expect(err?.message).toContain("No valid manifest found")
				done()
			})
		})
	})
})
