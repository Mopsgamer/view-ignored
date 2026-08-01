import type { Target } from "./targets/target.js"

import { describe, test, expect } from "bun:test"

import { ruleTest } from "./patterns/rule.js"
import { testScan } from "./testScan.test.js"

describe("SkipRule implementation", () => {
	const tree = {
		node_modules: {
			nested: {
				"ignored-nested.js": "nested",
			},
			"real-file.js": "console.log('real')",
		},
		src: {
			"index.ts": "import 'foo'",
		},
	}

	const makeCustomTarget = (): Target => {
		return {
			extractors: [],
			ignores: ruleTest,
			internalRules: [
				(options) => {
					if (options.entry !== "node_modules") return null
					const paths = new Map()
					paths.set("node_modules/custom-file.js", {
						ignored: false,
						kind: 7, // RuleMatchKind.internal
						pattern: "SkipRule-injected",
					})
					return {
						external: new Map(),
						failed: [],
						paths,
						total: new Map(),
					}
				},
			],
			root: ".",
		}
	}

	test("SkipRule skips directory traversal and merges returned context (skipInternal: false)", async (done) => {
		await testScan(
			done,
			tree,
			(o) => {
				const { ctx } = o
				// The real-file.js should NOT be traversed
				expect(ctx.paths.has("node_modules/real-file.js")).toBeFalse()
				expect(ctx.paths.has("node_modules/nested/ignored-nested.js")).toBeFalse()

				// The custom-file.js from the merged context should be present
				expect(ctx.paths.has("node_modules/custom-file.js")).toBeTrue()
				// oxlint-disable-next-line typescript/no-explicit-any
				expect((ctx.paths.get("node_modules/custom-file.js") as any).pattern).toBe(
					"SkipRule-injected",
				)

				// Other files should be traversed as usual
				expect(ctx.paths.has("src/index.ts")).toBeTrue()
			},
			{ skipInternal: false, target: makeCustomTarget() },
		)
	})

	test("SkipRule skips directory traversal and merges returned context (skipInternal: true)", async (done) => {
		await testScan(
			done,
			tree,
			(o) => {
				const { ctx } = o
				expect(ctx.paths.has("node_modules/real-file.js")).toBeFalse()
				expect(ctx.paths.has("node_modules/nested/ignored-nested.js")).toBeFalse()

				expect(ctx.paths.has("node_modules/custom-file.js")).toBeTrue()
				// oxlint-disable-next-line typescript/no-explicit-any
				expect((ctx.paths.get("node_modules/custom-file.js") as any).pattern).toBe(
					"SkipRule-injected",
				)

				expect(ctx.paths.has("src/index.ts")).toBeTrue()
			},
			{ skipInternal: true, target: makeCustomTarget() },
		)
	})
})
