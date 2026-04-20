import { describe, test, expect } from "bun:test"
import { Volume, type NestedDirectoryJSON } from "memfs"

import type { MatcherContext, Total } from "./matcherContext.js"
import type { Resource } from "./resource.js"
import type { RuleMatch } from "./rule.js"
import type { Source } from "./source.js"

import { scan, type ScanOptions } from "../scan.js"
import { NPM as target } from "../targets/npm.js"
import { createAdapter } from "../testScan.test.js"
import { unixify } from "../unixify.js"
import { matcherContextAddPath, matcherContextRemovePath } from "./matcherContextPatch.js"
import { patternCompile } from "./patternCompile.js"

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
function patchFS(transformFs: (newFsJson: typeof fsJson) => NestedDirectoryJSON) {
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
	name: "package.json",
	path: "package.json",
	rules: [
		{
			compiled: [patternCompile("/out", sourcePackageJsonExclude)],
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
	name: ".gitignore",
	path: ".gitignore",
	rules: [
		{
			compiled: [],
			excludes: false,
			pattern: [],
		},
		{
			compiled: [
				patternCompile("node_modules", sourceGitignoreExclude),
				patternCompile("out", sourceGitignoreExclude),
				patternCompile("dist", sourceGitignoreExclude),
				patternCompile("*.tgz", sourceGitignoreExclude),
				patternCompile("*.cpuprofile", sourceGitignoreExclude),
			],
			excludes: true,
			pattern: sourceGitignoreExclude,
		},
	],
}

const opt: Required<ScanOptions> = {
	cwd,
	depth: Infinity,
	fastDepth: false,
	fastInternal: false,
	fs: adapter,
	invert: false,
	signal: null,
	target,
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
				["LICENSE.txt", { ignored: false, kind: "internal", pattern: "LICENSE*" }],
				["out/", { ignored: false, kind: "external", pattern: "/out", source: sourcePackageJson }],
				[
					"out/index.js",
					{ ignored: false, kind: "external", pattern: "/out", source: sourcePackageJson },
				],
				[
					"out/patterns/",
					{ ignored: false, kind: "external", pattern: "/out", source: sourcePackageJson },
				],
				[
					"out/patterns/gitignore.js",
					{ ignored: false, kind: "external", pattern: "/out", source: sourcePackageJson },
				],
				[
					"out/patterns/index.js",
					{ ignored: false, kind: "external", pattern: "/out", source: sourcePackageJson },
				],
				[
					"out/patterns/jsrjson.js",
					{ ignored: false, kind: "external", pattern: "/out", source: sourcePackageJson },
				],
				[
					"out/targets/",
					{ ignored: false, kind: "external", pattern: "/out", source: sourcePackageJson },
				],
				[
					"out/targets/git.js",
					{ ignored: false, kind: "external", pattern: "/out", source: sourcePackageJson },
				],
				[
					"out/targets/index.js",
					{ ignored: false, kind: "external", pattern: "/out", source: sourcePackageJson },
				],
				[
					"out/targets/npm.js",
					{ ignored: false, kind: "external", pattern: "/out", source: sourcePackageJson },
				],
				["package.json", { ignored: false, kind: "internal", pattern: "package.json" }],
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
	fastDepth: false,
	fastInternal: false,
	fs: adapter,
	invert: false,
	signal: null,
	target,
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
				["LICENSE.txt", { ignored: false, kind: "internal", pattern: "LICENSE*" }],
				["out/", { ignored: false, kind: "external", pattern: "/out", source: sourcePackageJson }],
				[
					"out/index.js",
					{ ignored: false, kind: "external", pattern: "/out", source: sourcePackageJson },
				],
				[
					"out/patterns/",
					{ ignored: false, kind: "external", pattern: "/out", source: sourcePackageJson },
				],
				[
					"out/targets/",
					{ ignored: false, kind: "external", pattern: "/out", source: sourcePackageJson },
				],
				["package.json", { ignored: false, kind: "internal", pattern: "package.json" }],
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
		test("ignored dir is added (internal behavior)", async () => {
			const c = await scan(opt)
			expect(await matcherContextAddPath(c, opt, "test/")).toBeTrue()
		})
		test("ignored file is not added", async () => {
			const c = await scan(opt)
			expect(await matcherContextAddPath(c, opt, "test")).toBeFalse()
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
			expect(await matcherContextAddPath(c, o, "package.json")).toBeFalse()

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
					["LICENSE.txt", { ignored: false, kind: "internal", pattern: "LICENSE*" }],
					["src/", { ignored: false, kind: "no-match", source: sourceGitignore }],
					["src/index.ts", { ignored: false, kind: "no-match", source: sourceGitignore }],
					["src/patterns/", { ignored: false, kind: "no-match", source: sourceGitignore }],
					[
						"src/patterns/gitignore.ts",
						{ ignored: false, kind: "no-match", source: sourceGitignore },
					],
					["src/patterns/index.ts", { ignored: false, kind: "no-match", source: sourceGitignore }],
					[
						"src/patterns/jsrjson.ts",
						{ ignored: false, kind: "no-match", source: sourceGitignore },
					],
					["src/targets/", { ignored: false, kind: "no-match", source: sourceGitignore }],
					["src/targets/git.ts", { ignored: false, kind: "no-match", source: sourceGitignore }],
					["src/targets/index.ts", { ignored: false, kind: "no-match", source: sourceGitignore }],
					["src/targets/npm.ts", { ignored: false, kind: "no-match", source: sourceGitignore }],
					["package.json", { ignored: false, kind: "internal", pattern: "package.json" }],
					["tsconfig.prod.json", { ignored: false, kind: "no-match", source: sourceGitignore }],
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
			expect(await matcherContextAddPath(c, opt, "out/test")).toBeTrue()
			expect(await matcherContextAddPath(c, opt, "out/testdir/testsubdir/test")).toBeTrue()
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
					["LICENSE.txt", { ignored: false, kind: "internal", pattern: "LICENSE*" }],
					[
						"out/",
						{ ignored: false, kind: "external", pattern: "/out", source: sourcePackageJson },
					],
					[
						"out/test",
						{ ignored: false, kind: "external", pattern: "/out", source: sourcePackageJson },
					],
					[
						"out/testdir/",
						{ ignored: false, kind: "external", pattern: "/out", source: sourcePackageJson },
					],
					[
						"out/testdir/testsubdir/",
						{ ignored: false, kind: "external", pattern: "/out", source: sourcePackageJson },
					],
					[
						"out/testdir/testsubdir/test",
						{ ignored: false, kind: "external", pattern: "/out", source: sourcePackageJson },
					],
					[
						"out/index.js",
						{ ignored: false, kind: "external", pattern: "/out", source: sourcePackageJson },
					],
					[
						"out/patterns/",
						{ ignored: false, kind: "external", pattern: "/out", source: sourcePackageJson },
					],
					[
						"out/patterns/gitignore.js",
						{ ignored: false, kind: "external", pattern: "/out", source: sourcePackageJson },
					],
					[
						"out/patterns/index.js",
						{ ignored: false, kind: "external", pattern: "/out", source: sourcePackageJson },
					],
					[
						"out/patterns/jsrjson.js",
						{ ignored: false, kind: "external", pattern: "/out", source: sourcePackageJson },
					],
					[
						"out/targets/",
						{ ignored: false, kind: "external", pattern: "/out", source: sourcePackageJson },
					],
					[
						"out/targets/git.js",
						{ ignored: false, kind: "external", pattern: "/out", source: sourcePackageJson },
					],
					[
						"out/targets/index.js",
						{ ignored: false, kind: "external", pattern: "/out", source: sourcePackageJson },
					],
					[
						"out/targets/npm.js",
						{ ignored: false, kind: "external", pattern: "/out", source: sourcePackageJson },
					],
					["package.json", { ignored: false, kind: "internal", pattern: "package.json" }],
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
		test("ignored dir is removed", async () => {
			const c = await scan(opt)
			expect(await matcherContextRemovePath(c, opt, "test/")).toBeTrue()
		})
		test("ignored file is removed", async () => {
			const c = await scan(opt)
			expect(await matcherContextRemovePath(c, opt, "test")).toBeTrue()
		})
		test("foreign file is removed", async () => {
			const c = await scan(opt)
			expect(await matcherContextRemovePath(c, opt, "out/test")).toBeTrue()
			expect(await matcherContextRemovePath(c, opt, "out/testdir/testsubdir/test")).toBeTrue()
		})
		test("included file is removed", async () => {
			const c = await scan(opt)
			expect(await matcherContextRemovePath(c, opt, "out/index.js")).toBeTrue()
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
					["LICENSE.txt", { ignored: false, kind: "internal", pattern: "LICENSE*" }],
					[
						"out/",
						{ ignored: false, kind: "external", pattern: "/out", source: sourcePackageJson },
					],
					[
						"out/patterns/",
						{ ignored: false, kind: "external", pattern: "/out", source: sourcePackageJson },
					],
					[
						"out/patterns/gitignore.js",
						{ ignored: false, kind: "external", pattern: "/out", source: sourcePackageJson },
					],
					[
						"out/patterns/index.js",
						{ ignored: false, kind: "external", pattern: "/out", source: sourcePackageJson },
					],
					[
						"out/patterns/jsrjson.js",
						{ ignored: false, kind: "external", pattern: "/out", source: sourcePackageJson },
					],
					[
						"out/targets/",
						{ ignored: false, kind: "external", pattern: "/out", source: sourcePackageJson },
					],
					[
						"out/targets/git.js",
						{ ignored: false, kind: "external", pattern: "/out", source: sourcePackageJson },
					],
					[
						"out/targets/index.js",
						{ ignored: false, kind: "external", pattern: "/out", source: sourcePackageJson },
					],
					[
						"out/targets/npm.js",
						{ ignored: false, kind: "external", pattern: "/out", source: sourcePackageJson },
					],
					["package.json", { ignored: false, kind: "internal", pattern: "package.json" }],
				]),
				total: new Map<string, Total>([
					[".", { totalDirs: 11, totalFiles: 21, totalMatchedFiles: 8 }],
				]),
			})
		})
		test("included dir is removed", async () => {
			const c = await scan(opt)
			expect(await matcherContextRemovePath(c, opt, "out/")).toBeTrue()
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
					["LICENSE.txt", { ignored: false, kind: "internal", pattern: "LICENSE.*" }],
					["package.json", { ignored: false, kind: "internal", pattern: "package.json" }],
				]),
				total: new Map<string, Total>([
					[".", { totalDirs: 8, totalFiles: 15, totalMatchedFiles: 2 }],
				]),
			})
		})
	})
	describe("max depth 1", () => {
		test("should change ctx.total", async () => {
			const c = await scan(optDepth1)
			expect(await matcherContextRemovePath(c, optDepth1, "out/targets/index.js")).toBeTrue()
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
					["LICENSE.txt", { ignored: false, kind: "internal", pattern: "LICENSE*" }],
					[
						"out/",
						{ ignored: false, kind: "external", pattern: "/out", source: sourcePackageJson },
					],
					[
						"out/index.js",
						{ ignored: false, kind: "external", pattern: "/out", source: sourcePackageJson },
					],
					[
						"out/patterns/",
						{ ignored: false, kind: "external", pattern: "/out", source: sourcePackageJson },
					],
					[
						"out/targets/",
						{ ignored: false, kind: "external", pattern: "/out", source: sourcePackageJson },
					],
					["package.json", { ignored: false, kind: "internal", pattern: "package.json" }],
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
				delete (f as any)["package.json"]
				return f
			})
			expect(await matcherContextRemovePath(c, o, "package.json")).toBeTrue()

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
					["LICENSE.txt", { ignored: false, kind: "internal", pattern: "LICENSE.*" }],
					["src/", { ignored: false, kind: "no-match", source: sourceGitignore }],
					["src/index.ts", { ignored: false, kind: "no-match", source: sourceGitignore }],
					["src/patterns/", { ignored: false, kind: "no-match", source: sourceGitignore }],
					["src/targets/", { ignored: false, kind: "no-match", source: sourceGitignore }],
					["tsconfig.prod.json", { ignored: false, kind: "no-match", source: sourceGitignore }],
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
