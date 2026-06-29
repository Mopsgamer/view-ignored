import type { MatcherContext, Total } from "./matcherContext.js"
import type { Resource } from "./resource.js"
import type { Source } from "./source.js"

import { describe, test, expect } from "bun:test"
import { Volume, type NestedDirectoryJSON } from "memfs"

import { scan, type ScanOptions } from "../scan.js"
import { makeNPM } from "../targets/npm.js"
import { createAdapter } from "../testScan.test.js"
import { unixify } from "../unixify.js"
import { matcherContextAddPath, matcherContextRemovePath } from "./matcherContextPatch.js"
import { patternCompile } from "./patternCompile.js"
import { RuleMatchKind, type RuleMatch } from "./rule.js"

const fsJson = {
	".gitignore": "node_modules\nout\ndist\n*.tgz\n*.cpuprofile",
	"LICENSE.txt": "something something internal",
	node_modules: {
		".bin": {
			"a.exe": "00000001",
		},
		a: {
			bin: { "a.js": "run 00000001" },
			lib: { "index.js": "module a" },
			"package.json": JSON.stringify({
				bin: "./bin/a.js",
				name: "a",
				version: "0.0.1",
			}),
		},
	},
	out: {
		"index.js": "7out",
		patterns: {
			"gitignore.js": "4out",
			"index.js": "6out",
			"jsrjson.js": "5out",
		},
		targets: {
			"git.js": "2out",
			"index.js": "1out",
			"npm.js": "3out",
		},
	},
	"package.json": JSON.stringify({
		files: ["/out"],
		name: "view-ignored-inmem",
		version: "0.0.1",
	}),
	src: {
		"index.ts": "1src",
		patterns: {
			"gitignore.ts": "2src",
			"index.ts": "3src",
			"jsrjson.ts": "4src",
		},
		targets: {
			"git.ts": "5src",
			"index.ts": "6src",
			"npm.ts": "7src",
		},
	},
	"tsconfig.prod.json": "{compilerOptions...}",
}

const cwd = unixify(process.cwd())
// oxlint-disable-next-line typescript/no-explicit-any
function patchFS(transformFs: (newFsJson: any) => NestedDirectoryJSON) {
	const newFsJson = transformFs(structuredClone(fsJson))
	const vol = Volume.fromNestedJSON(newFsJson, cwd)

	const adapter = createAdapter(vol)
	return adapter
}

const vol = Volume.fromNestedJSON(fsJson, cwd)

const adapter = createAdapter(vol)

const sourcePackageJsonExclude = ["/out"]
const sourcePackageJson: Source = {
	inverted: true,
	path: "package.json",
	rules: [
		{
			compiled: [patternCompile("/out", { context: sourcePackageJsonExclude })],
			excludes: false,
			pattern: sourcePackageJsonExclude,
		},
		{
			compiled: [],
			excludes: true,
			pattern: [],
		},
	],
}

const sourceGitignoreExclude = ["node_modules", "out", "dist", "*.tgz", "*.cpuprofile"]
const sourceGitignore: Source = {
	inverted: false,
	path: ".gitignore",
	rules: [
		{
			compiled: [],
			excludes: false,
			pattern: [],
		},
		{
			compiled: [
				patternCompile("node_modules", { context: sourceGitignoreExclude }),
				patternCompile("out", { context: sourceGitignoreExclude }),
				patternCompile("dist", { context: sourceGitignoreExclude }),
				patternCompile("*.tgz", { context: sourceGitignoreExclude }),
				patternCompile("*.cpuprofile", { context: sourceGitignoreExclude }),
			],
			excludes: true,
			pattern: sourceGitignoreExclude,
		},
	],
}

const opt: Required<ScanOptions> = {
	cwd,
	depth: Infinity,
	dirs: true,
	fs: adapter,
	invert: false,
	signal: null,
	skipDepth: false,
	skipInternal: false,
	target: makeNPM(),
	within: ".",
}
const ctx = await scan(opt)
describe("matcherContext{Add,Remove}Path prepare", () => {
	test("ctx", () => {
		expect(ctx).toMatchObject(<MatcherContext>{
			external: new Map<string, Resource>([
				[".", sourcePackageJson],
				["node_modules", sourcePackageJson],
				["node_modules/.bin", sourcePackageJson],
				["node_modules/a", sourcePackageJson],
				["node_modules/a/bin", sourcePackageJson],
				["node_modules/a/lib", sourcePackageJson],
				["out", sourcePackageJson],
				["out/patterns", sourcePackageJson],
				["out/targets", sourcePackageJson],
				["src", sourcePackageJson],
				["src/patterns", sourcePackageJson],
				["src/targets", sourcePackageJson],
			]),
			failed: [],
			paths: new Map<string, RuleMatch>([
				["LICENSE.txt", { ignored: false, kind: RuleMatchKind.internal, pattern: "LICENSE*" }],
				[
					"out/",
					{
						ignored: false,
						kind: RuleMatchKind.external,
						pattern: "/out",
						source: sourcePackageJson,
					},
				],
				[
					"out/index.js",
					{
						ignored: false,
						kind: RuleMatchKind.external,
						pattern: "/out",
						source: sourcePackageJson,
					},
				],
				[
					"out/patterns/",
					{
						ignored: false,
						kind: RuleMatchKind.external,
						pattern: "/out",
						source: sourcePackageJson,
					},
				],
				[
					"out/patterns/gitignore.js",
					{
						ignored: false,
						kind: RuleMatchKind.external,
						pattern: "/out",
						source: sourcePackageJson,
					},
				],
				[
					"out/patterns/index.js",
					{
						ignored: false,
						kind: RuleMatchKind.external,
						pattern: "/out",
						source: sourcePackageJson,
					},
				],
				[
					"out/patterns/jsrjson.js",
					{
						ignored: false,
						kind: RuleMatchKind.external,
						pattern: "/out",
						source: sourcePackageJson,
					},
				],
				[
					"out/targets/",
					{
						ignored: false,
						kind: RuleMatchKind.external,
						pattern: "/out",
						source: sourcePackageJson,
					},
				],
				[
					"out/targets/git.js",
					{
						ignored: false,
						kind: RuleMatchKind.external,
						pattern: "/out",
						source: sourcePackageJson,
					},
				],
				[
					"out/targets/index.js",
					{
						ignored: false,
						kind: RuleMatchKind.external,
						pattern: "/out",
						source: sourcePackageJson,
					},
				],
				[
					"out/targets/npm.js",
					{
						ignored: false,
						kind: RuleMatchKind.external,
						pattern: "/out",
						source: sourcePackageJson,
					},
				],
				["package.json", { ignored: false, kind: RuleMatchKind.internal, pattern: "package.json" }],
			]),
			total: new Map<string, Total>([
				[
					".",
					{
						totalDirs: 11,
						totalFiles: 22,
						totalMatchedFiles: 9,
					},
				],
			]),
		})
	})
})

const optDepth1: Required<ScanOptions> = {
	cwd,
	depth: 1,
	dirs: true,
	fs: adapter,
	invert: false,
	signal: null,
	skipDepth: false,
	skipInternal: false,
	target: makeNPM(),
	within: ".",
}

const ctxDepth1 = await scan(optDepth1)
describe("matcherContext{Add,Remove}Path prepare", () => {
	test("ctxDepth1", () => {
		expect(ctxDepth1).toMatchObject(<MatcherContext>{
			external: new Map<string, Resource>([
				[".", sourcePackageJson],
				["node_modules", sourcePackageJson],
				["node_modules/.bin", sourcePackageJson],
				["node_modules/a", sourcePackageJson],
				["node_modules/a/bin", sourcePackageJson],
				["node_modules/a/lib", sourcePackageJson],
				["out", sourcePackageJson],
				["out/patterns", sourcePackageJson],
				["out/targets", sourcePackageJson],
				["src", sourcePackageJson],
				["src/patterns", sourcePackageJson],
				["src/targets", sourcePackageJson],
			]),
			failed: [],
			paths: new Map<string, RuleMatch>([
				["LICENSE.txt", { ignored: false, kind: RuleMatchKind.internal, pattern: "LICENSE*" }],
				[
					"out/",
					{
						ignored: false,
						kind: RuleMatchKind.external,
						pattern: "/out",
						source: sourcePackageJson,
					},
				],
				[
					"out/index.js",
					{
						ignored: false,
						kind: RuleMatchKind.external,
						pattern: "/out",
						source: sourcePackageJson,
					},
				],
				[
					"out/patterns/",
					{
						ignored: false,
						kind: RuleMatchKind.external,
						pattern: "/out",
						source: sourcePackageJson,
					},
				],
				[
					"out/targets/",
					{
						ignored: false,
						kind: RuleMatchKind.external,
						pattern: "/out",
						source: sourcePackageJson,
					},
				],
				["package.json", { ignored: false, kind: RuleMatchKind.internal, pattern: "package.json" }],
			]),
			total: new Map<string, Total>([
				[
					".",
					{
						totalDirs: 11,
						totalFiles: 22,
						totalMatchedFiles: 9,
					},
				],
				[
					"out",
					{
						totalDirs: 2,
						totalFiles: 6,
						totalMatchedFiles: 6,
					},
				],
			]),
		})
	})
})

describe("matcherContextAddPath", () => {
	describe("no max depth", () => {
		test("early return if path already exists", async () => {
			const c = await scan(opt)
			expect(await matcherContextAddPath(c, opt, "out/index.js")).toEqual([])
		})
		test("early return for root directory", async () => {
			const c = await scan(opt)
			expect(await matcherContextAddPath(c, opt, "./")).toEqual([])
		})
		test("ignored dir is not added to paths (internal behavior)", async () => {
			const c = await scan(opt)
			expect(await matcherContextAddPath(c, opt, "test/")).toEqual([])
		})
		test("ignored file is not added to paths, but added to totals", async () => {
			const c = await scan(opt)
			const initialTotal = { ...c.total.get(".")! }
			expect(await matcherContextAddPath(c, opt, "test")).toEqual([])
			expect(c.paths.has("test")).toBeFalse()
			expect(c.total.get(".")!.totalFiles).toBe(initialTotal.totalFiles + 1)
			expect(c.total.get(".")!.totalMatchedFiles).toBe(initialTotal.totalMatchedFiles)
		})
		test("source file is changed", async () => {
			const o = {
				...opt,
				fs: patchFS((json) => {
					json["package.json"] = JSON.stringify({
						name: "view-ignored-inmem",
						version: "0.0.1",
						// remove files prop
					})
					return json
				}),
			}
			const c = await scan(o)
			expect(await matcherContextAddPath(c, o, "package.json")).toEqual([])

			// NPM will use gitignore
			const newc = <MatcherContext>{
				external: new Map<string, Resource>([
					[".", sourceGitignore],
					["node_modules", sourceGitignore],
					["node_modules/.bin", sourceGitignore],
					["node_modules/a", sourceGitignore],
					["node_modules/a/bin", sourceGitignore],
					["node_modules/a/lib", sourceGitignore],
					["out", sourceGitignore],
					["out/patterns", sourceGitignore],
					["out/targets", sourceGitignore],
					["src", sourceGitignore],
					["src/patterns", sourceGitignore],
					["src/targets", sourceGitignore],
				]),
				failed: [],
				paths: new Map<string, RuleMatch>([
					["LICENSE.txt", { ignored: false, kind: RuleMatchKind.internal, pattern: "LICENSE*" }],
					["src/", { ignored: false, kind: RuleMatchKind.noMatch, source: sourceGitignore }],
					[
						"src/index.ts",
						{ ignored: false, kind: RuleMatchKind.noMatch, source: sourceGitignore },
					],
					[
						"src/patterns/",
						{ ignored: false, kind: RuleMatchKind.noMatch, source: sourceGitignore },
					],
					[
						"src/patterns/gitignore.ts",
						{ ignored: false, kind: RuleMatchKind.noMatch, source: sourceGitignore },
					],
					[
						"src/patterns/index.ts",
						{ ignored: false, kind: RuleMatchKind.noMatch, source: sourceGitignore },
					],
					[
						"src/patterns/jsrjson.ts",
						{ ignored: false, kind: RuleMatchKind.noMatch, source: sourceGitignore },
					],
					[
						"src/targets/",
						{ ignored: false, kind: RuleMatchKind.noMatch, source: sourceGitignore },
					],
					[
						"src/targets/git.ts",
						{ ignored: false, kind: RuleMatchKind.noMatch, source: sourceGitignore },
					],
					[
						"src/targets/index.ts",
						{ ignored: false, kind: RuleMatchKind.noMatch, source: sourceGitignore },
					],
					[
						"src/targets/npm.ts",
						{ ignored: false, kind: RuleMatchKind.noMatch, source: sourceGitignore },
					],
					[
						"package.json",
						{ ignored: false, kind: RuleMatchKind.internal, pattern: "package.json" },
					],
					[
						"tsconfig.prod.json",
						{ ignored: false, kind: RuleMatchKind.noMatch, source: sourceGitignore },
					],
				]),
				total: new Map<string, Total>([
					[
						".",
						{
							totalDirs: 11,
							totalFiles: 22,
							totalMatchedFiles: 10,
						},
					],
				]),
			}
			expect(c).toMatchObject(newc)
		})
		test("included file is added", async () => {
			const c = await scan(opt)
			expect(await matcherContextAddPath(c, opt, "out/test")).toEqual(["out/test"])
			expect(await matcherContextAddPath(c, opt, "out/testdir/testsubdir/test")).toEqual([
				"out/testdir/testsubdir/",
				"out/testdir/",
				"out/testdir/testsubdir/test",
			])
			expect(c).toMatchObject({
				external: new Map<string, Resource>([
					[".", sourcePackageJson],
					["node_modules", sourcePackageJson],
					["node_modules/.bin", sourcePackageJson],
					["node_modules/a", sourcePackageJson],
					["node_modules/a/bin", sourcePackageJson],
					["node_modules/a/lib", sourcePackageJson],
					["out", sourcePackageJson],
					["out/testdir", sourcePackageJson],
					["out/testdir/testsubdir", sourcePackageJson],
					["out/patterns", sourcePackageJson],
					["out/targets", sourcePackageJson],
					["src", sourcePackageJson],
					["src/patterns", sourcePackageJson],
					["src/targets", sourcePackageJson],
				]),
				failed: [],
				paths: new Map<string, RuleMatch>([
					["LICENSE.txt", { ignored: false, kind: RuleMatchKind.internal, pattern: "LICENSE*" }],
					[
						"out/",
						{
							ignored: false,
							kind: RuleMatchKind.external,
							pattern: "/out",
							source: sourcePackageJson,
						},
					],
					[
						"out/test",
						{
							ignored: false,
							kind: RuleMatchKind.external,
							pattern: "/out",
							source: sourcePackageJson,
						},
					],
					[
						"out/testdir/",
						{
							ignored: false,
							kind: RuleMatchKind.external,
							pattern: "/out",
							source: sourcePackageJson,
						},
					],
					[
						"out/testdir/testsubdir/",
						{
							ignored: false,
							kind: RuleMatchKind.external,
							pattern: "/out",
							source: sourcePackageJson,
						},
					],
					[
						"out/testdir/testsubdir/test",
						{
							ignored: false,
							kind: RuleMatchKind.external,
							pattern: "/out",
							source: sourcePackageJson,
						},
					],
					[
						"out/index.js",
						{
							ignored: false,
							kind: RuleMatchKind.external,
							pattern: "/out",
							source: sourcePackageJson,
						},
					],
					[
						"out/patterns/",
						{
							ignored: false,
							kind: RuleMatchKind.external,
							pattern: "/out",
							source: sourcePackageJson,
						},
					],
					[
						"out/patterns/gitignore.js",
						{
							ignored: false,
							kind: RuleMatchKind.external,
							pattern: "/out",
							source: sourcePackageJson,
						},
					],
					[
						"out/patterns/index.js",
						{
							ignored: false,
							kind: RuleMatchKind.external,
							pattern: "/out",
							source: sourcePackageJson,
						},
					],
					[
						"out/patterns/jsrjson.js",
						{
							ignored: false,
							kind: RuleMatchKind.external,
							pattern: "/out",
							source: sourcePackageJson,
						},
					],
					[
						"out/targets/",
						{
							ignored: false,
							kind: RuleMatchKind.external,
							pattern: "/out",
							source: sourcePackageJson,
						},
					],
					[
						"out/targets/git.js",
						{
							ignored: false,
							kind: RuleMatchKind.external,
							pattern: "/out",
							source: sourcePackageJson,
						},
					],
					[
						"out/targets/index.js",
						{
							ignored: false,
							kind: RuleMatchKind.external,
							pattern: "/out",
							source: sourcePackageJson,
						},
					],
					[
						"out/targets/npm.js",
						{
							ignored: false,
							kind: RuleMatchKind.external,
							pattern: "/out",
							source: sourcePackageJson,
						},
					],
					[
						"package.json",
						{ ignored: false, kind: RuleMatchKind.internal, pattern: "package.json" },
					],
				]),
				total: new Map<string, Total>([
					[".", { totalDirs: 13, totalFiles: 24, totalMatchedFiles: 11 }],
				]),
			})
		})
	})
})

describe("matcherContextRemovePath", () => {
	describe("no max depth", () => {
		test("root directory removal clears everything", async () => {
			const c = await scan(opt)
			const res = await matcherContextRemovePath(c, opt, "./")
			expect(res).toBeArray()
			expect(res.length).toBeGreaterThan(0)
			expect(c.paths.size).toBe(0)
			expect(c.external.size).toBe(0)
			expect(c.failed.length).toBe(0)
			expect(c.total.get(".")).toEqual({ totalDirs: 0, totalFiles: 0, totalMatchedFiles: 0 })
		})
		test("ignored dir is removed", async () => {
			const c = await scan(opt)
			expect(await matcherContextRemovePath(c, opt, "test/")).toEqual([])
		})
		test("ignored file is removed", async () => {
			const c = await scan(opt)
			expect(await matcherContextRemovePath(c, opt, "test")).toEqual([])
		})
		test("foreign file is removed", async () => {
			const c = await scan(opt)
			expect(await matcherContextRemovePath(c, opt, "out/test")).toEqual([])
			expect(await matcherContextRemovePath(c, opt, "out/testdir/testsubdir/test")).toEqual([])
		})
		test("included file is removed", async () => {
			const c = await scan(opt)
			expect(await matcherContextRemovePath(c, opt, "out/index.js")).toEqual(["out/index.js"])
			expect(c).toMatchObject({
				external: new Map<string, Resource>([
					[".", sourcePackageJson],
					["node_modules", sourcePackageJson],
					["node_modules/.bin", sourcePackageJson],
					["node_modules/a", sourcePackageJson],
					["node_modules/a/bin", sourcePackageJson],
					["node_modules/a/lib", sourcePackageJson],
					["out", sourcePackageJson],
					["out/patterns", sourcePackageJson],
					["out/targets", sourcePackageJson],
					["src", sourcePackageJson],
					["src/patterns", sourcePackageJson],
					["src/targets", sourcePackageJson],
				]),
				failed: [],
				paths: new Map<string, RuleMatch>([
					["LICENSE.txt", { ignored: false, kind: RuleMatchKind.internal, pattern: "LICENSE*" }],
					[
						"out/",
						{
							ignored: false,
							kind: RuleMatchKind.external,
							pattern: "/out",
							source: sourcePackageJson,
						},
					],
					[
						"out/patterns/",
						{
							ignored: false,
							kind: RuleMatchKind.external,
							pattern: "/out",
							source: sourcePackageJson,
						},
					],
					[
						"out/patterns/gitignore.js",
						{
							ignored: false,
							kind: RuleMatchKind.external,
							pattern: "/out",
							source: sourcePackageJson,
						},
					],
					[
						"out/patterns/index.js",
						{
							ignored: false,
							kind: RuleMatchKind.external,
							pattern: "/out",
							source: sourcePackageJson,
						},
					],
					[
						"out/patterns/jsrjson.js",
						{
							ignored: false,
							kind: RuleMatchKind.external,
							pattern: "/out",
							source: sourcePackageJson,
						},
					],
					[
						"out/targets/",
						{
							ignored: false,
							kind: RuleMatchKind.external,
							pattern: "/out",
							source: sourcePackageJson,
						},
					],
					[
						"out/targets/git.js",
						{
							ignored: false,
							kind: RuleMatchKind.external,
							pattern: "/out",
							source: sourcePackageJson,
						},
					],
					[
						"out/targets/index.js",
						{
							ignored: false,
							kind: RuleMatchKind.external,
							pattern: "/out",
							source: sourcePackageJson,
						},
					],
					[
						"out/targets/npm.js",
						{
							ignored: false,
							kind: RuleMatchKind.external,
							pattern: "/out",
							source: sourcePackageJson,
						},
					],
					[
						"package.json",
						{ ignored: false, kind: RuleMatchKind.internal, pattern: "package.json" },
					],
				]),
				total: new Map<string, Total>([
					[".", { totalDirs: 11, totalFiles: 21, totalMatchedFiles: 8 }],
				]),
			})
		})
		test("included dir is removed", async () => {
			const c = await scan(opt)
			const res = await matcherContextRemovePath(c, opt, "out/")
			expect(res).toContain("out/")
			expect(res).toContain("out/index.js")
			expect(c).toMatchObject({
				external: new Map<string, Resource>([
					[".", sourcePackageJson],
					["node_modules", sourcePackageJson],
					["src", sourcePackageJson],
					["node_modules/.bin", sourcePackageJson],
					["node_modules/a", sourcePackageJson],
					["src/patterns", sourcePackageJson],
					["src/targets", sourcePackageJson],
					["node_modules/a/bin", sourcePackageJson],
					["node_modules/a/lib", sourcePackageJson],
				]),
				failed: [],
				paths: new Map<string, RuleMatch>([
					["LICENSE.txt", { ignored: false, kind: RuleMatchKind.internal, pattern: "LICENSE.*" }],
					[
						"package.json",
						{ ignored: false, kind: RuleMatchKind.internal, pattern: "package.json" },
					],
				]),
				total: new Map<string, Total>([
					[".", { totalDirs: 8, totalFiles: 15, totalMatchedFiles: 2 }],
				]),
			})
		})
		test("source file update: remove and add back", async () => {
			const o = {
				...opt,
				fs: patchFS((json) => json),
			}
			const c = await scan(o)

			// Remove package.json (a source file)
			// Need to actually remove it from the filesystem for it to disappear during rescan
			o.fs = patchFS((json) => {
				delete json["package.json"]
				return json
			})
			await matcherContextRemovePath(c, o, "package.json")

			// The state should be different now.
			// Without package.json, NPM target falls back to gitignore which ignores "out"
			expect(c.paths.has("out/")).toBeFalse()

			// Add it back
			o.fs = patchFS((json) => json)
			await matcherContextAddPath(c, o, "package.json")

			// Should be back to state where out/ is included
			expect(c.paths.has("out/")).toBeTrue()
		})
	})
	describe("stat consistency", () => {
		test("adding then removing ignored file restores totals", async () => {
			const c = await scan(opt)
			const initialTotal = { ...c.total.get(".")! }
			await matcherContextAddPath(c, opt, "ignored.js")
			await matcherContextRemovePath(c, opt, "ignored.js")
			expect(c.total.get(".")!).toEqual(initialTotal)
		})

		test("removing directory accounts for ignored files in totals", async () => {
			const o = {
				...opt,
				fs: patchFS((json) => {
					json.src["ignored.js"] = "..."
					return json
				}),
			}
			const c = await scan(o)
			const initialTotal = { ...c.total.get(".")! }
			const srcTotal = { ...c.total.get("src")! }

			await matcherContextRemovePath(c, o, "src/")

			const finalTotal = c.total.get(".")!
			expect(finalTotal.totalFiles).toBe(initialTotal.totalFiles - srcTotal.totalFiles)
			expect(finalTotal.totalMatchedFiles).toBe(
				initialTotal.totalMatchedFiles - srcTotal.totalMatchedFiles,
			)
			expect(finalTotal.totalDirs).toBe(initialTotal.totalDirs - srcTotal.totalDirs - 1)
		})
	})

	describe("max depth 1", () => {
		test("should change ctx.total", async () => {
			const c = await scan(optDepth1)
			expect(await matcherContextRemovePath(c, optDepth1, "out/targets/index.js")).toEqual([])
			expect(c).toMatchObject(<MatcherContext>{
				external: new Map<string, Resource>([
					[".", sourcePackageJson],
					["node_modules", sourcePackageJson],
					["node_modules/.bin", sourcePackageJson],
					["node_modules/a", sourcePackageJson],
					["node_modules/a/bin", sourcePackageJson],
					["node_modules/a/lib", sourcePackageJson],
					["out", sourcePackageJson],
					["out/patterns", sourcePackageJson],
					["out/targets", sourcePackageJson],
					["src", sourcePackageJson],
					["src/patterns", sourcePackageJson],
					["src/targets", sourcePackageJson],
				]),
				failed: [],
				paths: new Map<string, RuleMatch>([
					["LICENSE.txt", { ignored: false, kind: RuleMatchKind.internal, pattern: "LICENSE*" }],
					[
						"out/",
						{
							ignored: false,
							kind: RuleMatchKind.external,
							pattern: "/out",
							source: sourcePackageJson,
						},
					],
					[
						"out/index.js",
						{
							ignored: false,
							kind: RuleMatchKind.external,
							pattern: "/out",
							source: sourcePackageJson,
						},
					],
					[
						"out/patterns/",
						{
							ignored: false,
							kind: RuleMatchKind.external,
							pattern: "/out",
							source: sourcePackageJson,
						},
					],
					[
						"out/targets/",
						{
							ignored: false,
							kind: RuleMatchKind.external,
							pattern: "/out",
							source: sourcePackageJson,
						},
					],
					[
						"package.json",
						{ ignored: false, kind: RuleMatchKind.internal, pattern: "package.json" },
					],
				]),
				total: new Map<string, Total>([
					[
						".",
						{
							totalDirs: 11,
							totalFiles: 22,
							totalMatchedFiles: 8,
						},
					],
				]),
			})
		})
		test("source file is changed", async () => {
			const o = { ...optDepth1 }
			const c = await scan(o)
			o.fs = patchFS((f) => {
				delete f["package.json"]
				return f
			})
			const res = await matcherContextRemovePath(c, o, "package.json")
			expect(res).toBeArray()

			// NPM will use gitignore
			const newc = <MatcherContext>{
				external: new Map<string, Resource>([
					[".", sourceGitignore],
					["node_modules", sourceGitignore],
					["out", sourceGitignore],
					["src", sourceGitignore],
					["node_modules/.bin", sourceGitignore],
					["node_modules/a", sourceGitignore],
					["out/patterns", sourceGitignore],
					["out/targets", sourceGitignore],
					["src/patterns", sourceGitignore],
					["src/targets", sourceGitignore],
					["node_modules/a/bin", sourceGitignore],
					["node_modules/a/lib", sourceGitignore],
				]),
				failed: [],
				paths: new Map<string, RuleMatch>([
					["LICENSE.txt", { ignored: false, kind: RuleMatchKind.internal, pattern: "LICENSE.*" }],
					["src/", { ignored: false, kind: RuleMatchKind.noMatch, source: sourceGitignore }],
					[
						"src/index.ts",
						{ ignored: false, kind: RuleMatchKind.noMatch, source: sourceGitignore },
					],
					[
						"src/patterns/",
						{ ignored: false, kind: RuleMatchKind.noMatch, source: sourceGitignore },
					],
					[
						"src/targets/",
						{ ignored: false, kind: RuleMatchKind.noMatch, source: sourceGitignore },
					],
					[
						"tsconfig.prod.json",
						{ ignored: false, kind: RuleMatchKind.noMatch, source: sourceGitignore },
					],
				]),
				total: new Map<string, Total>([
					[
						".",
						{
							totalDirs: 12,
							totalFiles: 21,
							totalMatchedFiles: 5,
						},
					],
				]),
			}
			expect(c).toMatchObject(newc)
		})
	})
})
