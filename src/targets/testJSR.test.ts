import type { NestedDirectoryJSON } from "memfs"

import type { PathHandlerOptions } from "../testScan.test.js"

import { describe, expect, test } from "bun:test"

import { testScan } from "../testScan.test.js"
import { JSR as target } from "./jsr.js"
import { jsrManifestParse } from "./jsrManifest.js"

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
	const validJsrJson = JSON.stringify({
		exports: "./mod.ts",
		name: "@scope/pkg",
		version: "1.0.0",
	})
	const invalidPackageJson = '{ "name": 0, "version": 0 }'
	test("ignores package.json if valid jsr.json exists", async (done) => {
		expect(() =>
			testJSR(done, { "jsr.json": validJsrJson, "package.json": invalidPackageJson }, () => {}),
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
		})

		test("throws error if required fields are missing", () => {
			const missingFields = JSON.stringify({
				name: "@scope/pkg",
			})

			expect(() => jsrManifestParse(missingFields)).toThrow(
				"Missing or invalid 'version' in manifest",
			)
		})
	})
})
