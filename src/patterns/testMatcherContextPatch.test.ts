import { describe, test } from "bun:test"
import { deepEqual, equal, ok } from "node:assert/strict"
import { matcherContextAddPath, matcherContextRemovePath } from "./matcherContextPatch.js"
import { scan, type ScanOptions } from "../scan.js"
import { NPM as target } from "../targets/npm.js"
import { createAdapter } from "../testScan.test.js"
import { Volume } from "memfs"
import type { MatcherContext } from "./matcherContext.js"
import type { Source } from "./source.js"
import type { SignedPatternMatch } from "./signedPattern.js"
import type { PatternMinimatch, Pattern } from "./pattern.js"

const cwd = process.cwd().replaceAll("\\", "/").replace(/\w:/, "")
const vol = Volume.fromNestedJSON(
	{
		node_modules: {
			".bin": {
				"a.exe": "00000001",
			},
			a: {
				bin: { "a.js": "run 00000001" },
				lib: { "index.js": "module a" },
				"package.json": JSON.stringify({
					name: "a",
					version: "0.0.1",
					bin: "./bin/a.js",
				}),
			},
		},
		src: {
			targets: {
				"index.ts": "1src",
				"git.ts": "2src",
				"npm.ts": "3src",
			},
			patterns: {
				"gitignore.ts": "4src",
				"jsrjson.ts": "5src",
				"index.ts": "6src",
			},
			"index.json": "7src",
		},
		out: {
			targets: {
				"index.ts": "1out",
				"git.ts": "2out",
				"npm.ts": "3out",
			},
			patterns: {
				"gitignore.ts": "4out",
				"jsrjson.ts": "5out",
				"index.ts": "6out",
			},
			"index.json": "7out",
		},
		"tsconfig.prod.json": "{compilerOptions...}",
		"LICENSE.txt": "something something internal",
		".gitignore": "node_modules\nout\ndist\n*.tgz\n*.cpuprofile",
		"package.json": JSON.stringify({
			name: "view-ignored-inmem",
			version: "0.0.1",
			files: ["/out"],
		}),
	},
	cwd,
)

const adapter = createAdapter(vol)

function makePatternMinimatch(
	rg: RegExp,
	pattern: string,
	patternContext: Pattern,
): PatternMinimatch {
	;(rg as PatternMinimatch).pattern = pattern
	;(rg as PatternMinimatch).patternContext = patternContext

	return rg as PatternMinimatch
}

const source: Source = {
	inverted: true,
	name: "package.json",
	path: "package.json",
	pattern: {
		include: ["/out"],
		exclude: [],
		compiled: {
			include: [
				makePatternMinimatch(/^out(?:\/|\/(?:(?!(?:\/|^)(?:\.{1,2})($|\/)).)*?)?$/, "/out", [
					"/out",
				]),
			],
			exclude: [],
		},
	},
}

const o: Required<ScanOptions> = {
	target,
	fs: adapter,
	cwd,
	depth: Infinity,
	fastDepth: false,
	fastInternal: false,
	invert: false,
	signal: null,
}
const ctx = await scan(o)
test("ctx", () => {
	deepEqual(ctx, {
		depthPaths: new Map<string, number>([]),
		external: new Map<string, Source>([
			[".", source],
			["node_modules", source],
			["node_modules/.bin", source],
			["node_modules/a", source],
			["node_modules/a/bin", source],
			["node_modules/a/lib", source],
			["out", source],
			["out/patterns", source],
			["out/targets", source],
			["src", source],
			["src/patterns", source],
			["src/targets", source],
		]),
		failed: [],
		paths: new Map<string, SignedPatternMatch>([
			["LICENSE.txt", { kind: "internal", ignored: false, pattern: "LICENSE*" }],
			["out/", { kind: "external", ignored: false, pattern: "/out", source }],
			["out/index.json", { kind: "external", ignored: false, pattern: "/out", source }],
			["out/patterns/", { kind: "external", ignored: false, pattern: "/out", source }],
			["out/patterns/gitignore.ts", { kind: "external", ignored: false, pattern: "/out", source }],
			["out/patterns/index.ts", { kind: "external", ignored: false, pattern: "/out", source }],
			["out/patterns/jsrjson.ts", { kind: "external", ignored: false, pattern: "/out", source }],
			["out/targets/", { kind: "external", ignored: false, pattern: "/out", source }],
			["out/targets/git.ts", { kind: "external", ignored: false, pattern: "/out", source }],
			["out/targets/index.ts", { kind: "external", ignored: false, pattern: "/out", source }],
			["out/targets/npm.ts", { kind: "external", ignored: false, pattern: "/out", source }],
			["package.json", { kind: "internal", ignored: false, pattern: "package.json" }],
		]),
		totalDirs: 11,
		totalFiles: 22,
		totalMatchedFiles: 9,
	} as MatcherContext)
})

const oDepth1: Required<ScanOptions> = {
	target,
	fs: adapter,
	cwd,
	depth: 1,
	fastDepth: false,
	fastInternal: false,
	invert: false,
	signal: null,
}

const ctxDepth1 = await scan(oDepth1)
test("ctxDepth1", () => {
	deepEqual(ctxDepth1, {
		depthPaths: new Map<string, number>([
			["out/patterns", 3],
			["out/targets", 3],
		]),
		external: new Map<string, Source>([
			[".", source],
			["node_modules", source],
			["node_modules/.bin", source],
			["node_modules/a", source],
			["node_modules/a/bin", source],
			["node_modules/a/lib", source],
			["out", source],
			["out/patterns", source],
			["out/targets", source],
			["src", source],
			["src/patterns", source],
			["src/targets", source],
		]),
		failed: [],
		paths: new Map<string, SignedPatternMatch>([
			["LICENSE.txt", { kind: "internal", ignored: false, pattern: "LICENSE*" }],
			["out/", { kind: "external", ignored: false, pattern: "/out", source }],
			["out/index.json", { kind: "external", ignored: false, pattern: "/out", source }],
			["out/patterns/", { kind: "external", ignored: false, pattern: "/out", source }],
			["out/targets/", { kind: "external", ignored: false, pattern: "/out", source }],
			["package.json", { kind: "internal", ignored: false, pattern: "package.json" }],
		]),
		totalDirs: 11,
		totalFiles: 22,
		totalMatchedFiles: 9,
	} as MatcherContext)
})

describe("matcherContextAddPath", () => {
	test("ignored dir is added (internal behavior)", async () => {
		const ctx = await scan(o)
		ok(await matcherContextAddPath(ctx, o, "test/"))
	})
	test("ignored file is not added", async () => {
		const ctx = await scan(o)
		ok(!(await matcherContextAddPath(ctx, o, "test")))
	})
	test("included file is added", async () => {
		const ctx = await scan(o)
		ok(await matcherContextAddPath(ctx, o, "out/test"))
		ok(await matcherContextAddPath(ctx, o, "out/testdir/testsubdir/test"))
		equal(ctx.depthPaths.size, 0)
		equal(ctx.failed.length, 0)
		deepEqual(
			ctx.external,
			new Map<string, Source>([
				[".", source],
				["node_modules", source],
				["node_modules/.bin", source],
				["node_modules/a", source],
				["node_modules/a/bin", source],
				["node_modules/a/lib", source],
				["out", source],
				["out/testdir", source],
				["out/testdir/testsubdir", source],
				["out/patterns", source],
				["out/targets", source],
				["src", source],
				["src/patterns", source],
				["src/targets", source],
			]),
		)
		deepEqual(ctx.paths, new Map<string, SignedPatternMatch>([
			["LICENSE.txt", { kind: "internal", ignored: false, pattern: "LICENSE*" }],
			["out/", { kind: "external", ignored: false, pattern: "/out", source }],
			["out/test", { kind: "external", ignored: false, pattern: "/out", source }],
			["out/testdir/", { kind: "external", ignored: false, pattern: "/out", source }],
			["out/testdir/testsubdir/", { kind: "external", ignored: false, pattern: "/out", source }],
			["out/testdir/testsubdir/test", { kind: "external", ignored: false, pattern: "/out", source }],
			["out/index.json", { kind: "external", ignored: false, pattern: "/out", source }],
			["out/patterns/", { kind: "external", ignored: false, pattern: "/out", source }],
			["out/patterns/gitignore.ts", { kind: "external", ignored: false, pattern: "/out", source }],
			["out/patterns/index.ts", { kind: "external", ignored: false, pattern: "/out", source }],
			["out/patterns/jsrjson.ts", { kind: "external", ignored: false, pattern: "/out", source }],
			["out/targets/", { kind: "external", ignored: false, pattern: "/out", source }],
			["out/targets/git.ts", { kind: "external", ignored: false, pattern: "/out", source }],
			["out/targets/index.ts", { kind: "external", ignored: false, pattern: "/out", source }],
			["out/targets/npm.ts", { kind: "external", ignored: false, pattern: "/out", source }],
			["package.json", { kind: "internal", ignored: false, pattern: "package.json" }],
		]))
		equal(ctx.totalDirs, 13)
		equal(ctx.totalFiles, 24)
		equal(ctx.totalMatchedFiles, 11)
	})
})
describe("matcherContextRemovePath", () => {
	test("ignored dir is removed", async () => {
		const ctx = await scan(o)
		ok(await matcherContextRemovePath(ctx, o, "test/"))
	})
	test("ignored file is removed", async () => {
		const ctx = await scan(o)
		ok(await matcherContextRemovePath(ctx, o, "test"))
	})
	test("foreign file is removed", async () => {
		const ctx = await scan(o)
		ok(await matcherContextRemovePath(ctx, o, "out/test"))
		ok(await matcherContextRemovePath(ctx, o, "out/testdir/testsubdir/test"))
	})
	test("included file is removed", async () => {
		const ctx = await scan(o)
		ok(await matcherContextRemovePath(ctx, o, "out/"))
		equal(ctx.depthPaths.size, 0)
		equal(ctx.failed.length, 0)
		deepEqual(
			ctx.external,
			new Map<string, Source>([
				[".", source],
				["node_modules", source],
				["node_modules/.bin", source],
				["node_modules/a", source],
				["node_modules/a/bin", source],
				["node_modules/a/lib", source],
				["src", source],
				["src/patterns", source],
				["src/targets", source],
			]),
		)
		deepEqual(ctx.paths, new Map<string, SignedPatternMatch>([
			["LICENSE.txt", { kind: "internal", ignored: false, pattern: "LICENSE*" }],
			["package.json", { kind: "internal", ignored: false, pattern: "package.json" }],
		]))
		equal(ctx.totalDirs, 8)
		equal(ctx.totalFiles, 15)
		equal(ctx.totalMatchedFiles, 2)
	})
})
