import { describe, test } from "bun:test"
import { deepEqual, equal, ok } from "node:assert/strict"
import { matcherContextAddPath, matcherContextRemovePath } from "./matcherContextPatch.js"
import { scan, type ScanOptions } from "../scan.js"
import { NPM as target } from "../targets/npm.js"
import { createAdapter } from "../testScan.test.js"
import { Volume, type NestedDirectoryJSON } from "memfs"
import type { MatcherContext } from "./matcherContext.js"
import type { Source } from "./source.js"
import type { SignedPatternMatch } from "./signedPattern.js"
import type { PatternMinimatch, Pattern } from "./pattern.js"

const fsJson = {
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
		"index.ts": "7src",
	},
	out: {
		targets: {
			"index.js": "1out",
			"git.js": "2out",
			"npm.js": "3out",
		},
		patterns: {
			"gitignore.js": "4out",
			"jsrjson.js": "5out",
			"index.js": "6out",
		},
		"index.js": "7out",
	},
	"tsconfig.prod.json": "{compilerOptions...}",
	"LICENSE.txt": "something something internal",
	".gitignore": "node_modules\nout\ndist\n*.tgz\n*.cpuprofile",
	"package.json": JSON.stringify({
		name: "view-ignored-inmem",
		version: "0.0.1",
		files: ["/out"],
	}),
}

const cwd = process.cwd().replaceAll("\\", "/").replace(/\w:/, "")
function patchFS(transformFs: (newFsJson: typeof fsJson) => NestedDirectoryJSON) {
	const newFsJson = transformFs(structuredClone(fsJson))
	const vol = Volume.fromNestedJSON(newFsJson, cwd)

	const adapter = createAdapter(vol)
	return adapter
}

const vol = Volume.fromNestedJSON(fsJson, cwd)

const adapter = createAdapter(vol)

function makePatternMinimatch(
	re: RegExp,
	pattern: string,
	patternContext: Pattern,
): PatternMinimatch {
	return {
		re,
		pattern,
		patternContext,
	}
}

const sourcePackageJsonExclude = ["/out"]
const sourcePackageJson: Source = {
	inverted: true,
	name: "package.json",
	path: "package.json",
	pattern: {
		include: sourcePackageJsonExclude,
		exclude: [],
		compiled: {
			include: [
				makePatternMinimatch(
					/^out(?:\/|\/(?:(?!(?:\/|^)(?:\.{1,2})($|\/)).)*?)?$/,
					"/out",
					sourcePackageJsonExclude,
				),
			],
			exclude: [],
		},
	},
}

const sourceGitignoreExclude = ["node_modules", "out", "dist", "*.tgz", "*.cpuprofile"]
const sourceGitignore: Source = {
	name: ".gitignore",
	path: ".gitignore",
	inverted: false,
	pattern: {
		exclude: sourceGitignoreExclude,
		include: [],
		compiled: {
			exclude: [
				makePatternMinimatch(
					/^(?:\/|(?:(?!(?:\/|^)(?:\.{1,2})($|\/)).)*?\/)?node_modules(?:\/|\/(?:(?!(?:\/|^)(?:\.{1,2})($|\/)).)*?)?$/,
					"node_modules",
					sourceGitignoreExclude,
				),
				makePatternMinimatch(
					/^(?:\/|(?:(?!(?:\/|^)(?:\.{1,2})($|\/)).)*?\/)?out(?:\/|\/(?:(?!(?:\/|^)(?:\.{1,2})($|\/)).)*?)?$/,
					"out",
					sourceGitignoreExclude,
				),
				makePatternMinimatch(
					/^(?:\/|(?:(?!(?:\/|^)(?:\.{1,2})($|\/)).)*?\/)?dist(?:\/|\/(?:(?!(?:\/|^)(?:\.{1,2})($|\/)).)*?)?$/,
					"dist",
					sourceGitignoreExclude,
				),
				makePatternMinimatch(
					/^(?:\/|(?:(?!(?:\/|^)(?:\.{1,2})($|\/)).)*?\/)?(?!(?:^|\/)\.\.?(?:$|\/))[^/]*?\.tgz(?:\/|\/(?:(?!(?:\/|^)(?:\.{1,2})($|\/)).)*?)?$/,
					"*.tgz",
					sourceGitignoreExclude,
				),
				makePatternMinimatch(
					/^(?:\/|(?:(?!(?:\/|^)(?:\.{1,2})($|\/)).)*?\/)?(?!(?:^|\/)\.\.?(?:$|\/))[^/]*?\.cpuprofile(?:\/|\/(?:(?!(?:\/|^)(?:\.{1,2})($|\/)).)*?)?$/,
					"*.cpuprofile",
					sourceGitignoreExclude,
				),
			],
			include: [],
		},
	},
}

const opt: Required<ScanOptions> = {
	target,
	fs: adapter,
	cwd,
	depth: Infinity,
	fastDepth: false,
	fastInternal: false,
	invert: false,
	signal: null,
}
const ctx = await scan(opt)
describe("matcherContext{Add,Remove}Path prepare", () => {
	test("ctx", () => {
		deepEqual(ctx, <MatcherContext>{
			depthPaths: new Map<string, number>([]),
			external: new Map<string, Source>([
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
			paths: new Map<string, SignedPatternMatch>([
				["LICENSE.txt", { kind: "internal", ignored: false, pattern: "LICENSE*" }],
				["out/", { kind: "external", ignored: false, pattern: "/out", source: sourcePackageJson }],
				[
					"out/index.js",
					{ kind: "external", ignored: false, pattern: "/out", source: sourcePackageJson },
				],
				[
					"out/patterns/",
					{ kind: "external", ignored: false, pattern: "/out", source: sourcePackageJson },
				],
				[
					"out/patterns/gitignore.js",
					{ kind: "external", ignored: false, pattern: "/out", source: sourcePackageJson },
				],
				[
					"out/patterns/index.js",
					{ kind: "external", ignored: false, pattern: "/out", source: sourcePackageJson },
				],
				[
					"out/patterns/jsrjson.js",
					{ kind: "external", ignored: false, pattern: "/out", source: sourcePackageJson },
				],
				[
					"out/targets/",
					{ kind: "external", ignored: false, pattern: "/out", source: sourcePackageJson },
				],
				[
					"out/targets/git.js",
					{ kind: "external", ignored: false, pattern: "/out", source: sourcePackageJson },
				],
				[
					"out/targets/index.js",
					{ kind: "external", ignored: false, pattern: "/out", source: sourcePackageJson },
				],
				[
					"out/targets/npm.js",
					{ kind: "external", ignored: false, pattern: "/out", source: sourcePackageJson },
				],
				["package.json", { kind: "internal", ignored: false, pattern: "package.json" }],
			]),
			failed: [],
			totalDirs: 11,
			totalFiles: 22,
			totalMatchedFiles: 9,
		})
	})
})

const optDepth1: Required<ScanOptions> = {
	target,
	fs: adapter,
	cwd,
	depth: 1,
	fastDepth: false,
	fastInternal: false,
	invert: false,
	signal: null,
}

const ctxDepth1 = await scan(optDepth1)
describe("matcherContext{Add,Remove}Path prepare", () => {
	test("ctxDepth1", () => {
		deepEqual(ctxDepth1, <MatcherContext>{
			depthPaths: new Map<string, number>([
				["out/patterns", 3],
				["out/targets", 3],
			]),
			external: new Map<string, Source>([
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
			paths: new Map<string, SignedPatternMatch>([
				["LICENSE.txt", { kind: "internal", ignored: false, pattern: "LICENSE*" }],
				["out/", { kind: "external", ignored: false, pattern: "/out", source: sourcePackageJson }],
				[
					"out/index.js",
					{ kind: "external", ignored: false, pattern: "/out", source: sourcePackageJson },
				],
				[
					"out/patterns/",
					{ kind: "external", ignored: false, pattern: "/out", source: sourcePackageJson },
				],
				[
					"out/targets/",
					{ kind: "external", ignored: false, pattern: "/out", source: sourcePackageJson },
				],
				["package.json", { kind: "internal", ignored: false, pattern: "package.json" }],
			]),
			failed: [],
			totalDirs: 11,
			totalFiles: 22,
			totalMatchedFiles: 9,
		})
	})
})

describe("matcherContextAddPath", () => {
	describe("no max depth", () => {
		test("ignored dir is added (internal behavior)", async () => {
			const c = await scan(opt)
			ok(await matcherContextAddPath(c, opt, "test/"))
		})
		test("ignored file is not added", async () => {
			const c = await scan(opt)
			ok(!(await matcherContextAddPath(c, opt, "test")))
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
			ok(!(await matcherContextAddPath(c, o, "package.json")))

			// NPM will use gitignore
			const newc = <MatcherContext>{
				depthPaths: new Map<string, number>([]),
				external: new Map<string, Source>([
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
				paths: new Map<string, SignedPatternMatch>([
					["LICENSE.txt", { kind: "internal", ignored: false, pattern: "LICENSE*" }],
					["src/", { kind: "no-match", ignored: false }],
					["src/index.ts", { kind: "no-match", ignored: false }],
					["src/patterns/", { kind: "no-match", ignored: false }],
					["src/patterns/gitignore.ts", { kind: "no-match", ignored: false }],
					["src/patterns/index.ts", { kind: "no-match", ignored: false }],
					["src/patterns/jsrjson.ts", { kind: "no-match", ignored: false }],
					["src/targets/", { kind: "no-match", ignored: false }],
					["src/targets/git.ts", { kind: "no-match", ignored: false }],
					["src/targets/index.ts", { kind: "no-match", ignored: false }],
					["src/targets/npm.ts", { kind: "no-match", ignored: false }],
					["package.json", { kind: "internal", ignored: false, pattern: "package.json" }],
					["tsconfig.prod.json", { kind: "no-match", ignored: false }],
				]),
				failed: [],
				totalDirs: 11,
				totalFiles: 22,
				totalMatchedFiles: 10,
			}
			debugger
			deepEqual(c, newc)
		})
		test("included file is added", async () => {
			const c = await scan(opt)
			ok(await matcherContextAddPath(c, opt, "out/test"))
			ok(await matcherContextAddPath(c, opt, "out/testdir/testsubdir/test"))
			equal(c.depthPaths.size, 0)
			equal(c.failed.length, 0)
			deepEqual(
				c.external,
				new Map<string, Source>([
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
			)
			deepEqual(
				c.paths,
				new Map<string, SignedPatternMatch>([
					["LICENSE.txt", { kind: "internal", ignored: false, pattern: "LICENSE*" }],
					[
						"out/",
						{ kind: "external", ignored: false, pattern: "/out", source: sourcePackageJson },
					],
					[
						"out/test",
						{ kind: "external", ignored: false, pattern: "/out", source: sourcePackageJson },
					],
					[
						"out/testdir/",
						{ kind: "external", ignored: false, pattern: "/out", source: sourcePackageJson },
					],
					[
						"out/testdir/testsubdir/",
						{ kind: "external", ignored: false, pattern: "/out", source: sourcePackageJson },
					],
					[
						"out/testdir/testsubdir/test",
						{ kind: "external", ignored: false, pattern: "/out", source: sourcePackageJson },
					],
					[
						"out/index.js",
						{ kind: "external", ignored: false, pattern: "/out", source: sourcePackageJson },
					],
					[
						"out/patterns/",
						{ kind: "external", ignored: false, pattern: "/out", source: sourcePackageJson },
					],
					[
						"out/patterns/gitignore.js",
						{ kind: "external", ignored: false, pattern: "/out", source: sourcePackageJson },
					],
					[
						"out/patterns/index.js",
						{ kind: "external", ignored: false, pattern: "/out", source: sourcePackageJson },
					],
					[
						"out/patterns/jsrjson.js",
						{ kind: "external", ignored: false, pattern: "/out", source: sourcePackageJson },
					],
					[
						"out/targets/",
						{ kind: "external", ignored: false, pattern: "/out", source: sourcePackageJson },
					],
					[
						"out/targets/git.js",
						{ kind: "external", ignored: false, pattern: "/out", source: sourcePackageJson },
					],
					[
						"out/targets/index.js",
						{ kind: "external", ignored: false, pattern: "/out", source: sourcePackageJson },
					],
					[
						"out/targets/npm.js",
						{ kind: "external", ignored: false, pattern: "/out", source: sourcePackageJson },
					],
					["package.json", { kind: "internal", ignored: false, pattern: "package.json" }],
				]),
			)
			equal(c.totalDirs, 13)
			equal(c.totalFiles, 24)
			equal(c.totalMatchedFiles, 11)
		})
	})
})

describe("matcherContextRemovePath", () => {
	describe("no max depth", () => {
		test("ignored dir is removed", async () => {
			const c = await scan(opt)
			ok(await matcherContextRemovePath(c, opt, "test/"))
		})
		test("ignored file is removed", async () => {
			const c = await scan(opt)
			ok(await matcherContextRemovePath(c, opt, "test"))
		})
		test("foreign file is removed", async () => {
			const c = await scan(opt)
			ok(await matcherContextRemovePath(c, opt, "out/test"))
			ok(await matcherContextRemovePath(c, opt, "out/testdir/testsubdir/test"))
		})
		test("included file is removed", async () => {
			const c = await scan(opt)
			ok(await matcherContextRemovePath(c, opt, "out/index.js"))
			equal(c.depthPaths.size, 0)
			equal(c.failed.length, 0)
			deepEqual(
				c.external,
				new Map<string, Source>([
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
			)
			deepEqual(
				c.paths,
				new Map<string, SignedPatternMatch>([
					["LICENSE.txt", { kind: "internal", ignored: false, pattern: "LICENSE*" }],
					[
						"out/",
						{ kind: "external", ignored: false, pattern: "/out", source: sourcePackageJson },
					],
					[
						"out/patterns/",
						{ kind: "external", ignored: false, pattern: "/out", source: sourcePackageJson },
					],
					[
						"out/patterns/gitignore.js",
						{ kind: "external", ignored: false, pattern: "/out", source: sourcePackageJson },
					],
					[
						"out/patterns/index.js",
						{ kind: "external", ignored: false, pattern: "/out", source: sourcePackageJson },
					],
					[
						"out/patterns/jsrjson.js",
						{ kind: "external", ignored: false, pattern: "/out", source: sourcePackageJson },
					],
					[
						"out/targets/",
						{ kind: "external", ignored: false, pattern: "/out", source: sourcePackageJson },
					],
					[
						"out/targets/git.js",
						{ kind: "external", ignored: false, pattern: "/out", source: sourcePackageJson },
					],
					[
						"out/targets/index.js",
						{ kind: "external", ignored: false, pattern: "/out", source: sourcePackageJson },
					],
					[
						"out/targets/npm.js",
						{ kind: "external", ignored: false, pattern: "/out", source: sourcePackageJson },
					],
					["package.json", { kind: "internal", ignored: false, pattern: "package.json" }],
				]),
			)
			equal(c.totalDirs, 11)
			equal(c.totalFiles, 21)
			equal(c.totalMatchedFiles, 8)
		})
		test("included dir is removed", async () => {
			const c = await scan(opt)
			ok(await matcherContextRemovePath(c, opt, "out/"))
			equal(c.depthPaths.size, 0)
			equal(c.failed.length, 0)
			deepEqual(
				c.external,
				new Map<string, Source>([
					[".", sourcePackageJson],
					["node_modules", sourcePackageJson],
					["node_modules/.bin", sourcePackageJson],
					["node_modules/a", sourcePackageJson],
					["node_modules/a/bin", sourcePackageJson],
					["node_modules/a/lib", sourcePackageJson],
					["src", sourcePackageJson],
					["src/patterns", sourcePackageJson],
					["src/targets", sourcePackageJson],
				]),
			)
			deepEqual(
				c.paths,
				new Map<string, SignedPatternMatch>([
					["LICENSE.txt", { kind: "internal", ignored: false, pattern: "LICENSE*" }],
					["package.json", { kind: "internal", ignored: false, pattern: "package.json" }],
				]),
			)
			equal(c.totalDirs, 8)
			equal(c.totalFiles, 15)
			equal(c.totalMatchedFiles, 2)
		})
	})
	describe("max depth 1", () => {
		test("should change ctx.depthPaths", async () => {
			const c = await scan(optDepth1)
			ok(await matcherContextRemovePath(c, optDepth1, "out/targets/index.js"))
			deepEqual(c, <MatcherContext>{
				depthPaths: new Map<string, number>([
					["out/patterns", 3],
					["out/targets", 2],
				]),
				external: new Map<string, Source>([
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
				paths: new Map<string, SignedPatternMatch>([
					["LICENSE.txt", { kind: "internal", ignored: false, pattern: "LICENSE*" }],
					[
						"out/",
						{ kind: "external", ignored: false, pattern: "/out", source: sourcePackageJson },
					],
					[
						"out/index.js",
						{ kind: "external", ignored: false, pattern: "/out", source: sourcePackageJson },
					],
					[
						"out/patterns/",
						{ kind: "external", ignored: false, pattern: "/out", source: sourcePackageJson },
					],
					[
						"out/targets/",
						{ kind: "external", ignored: false, pattern: "/out", source: sourcePackageJson },
					],
					["package.json", { kind: "internal", ignored: false, pattern: "package.json" }],
				]),
				failed: [],
				totalDirs: 11,
				totalFiles: 21,
				totalMatchedFiles: 8,
			})
		})
		test("source file is changed", async () => {
			const o = { ...optDepth1 }
			const c = await scan(o)
			o.fs = patchFS((f) => {
				delete (f as any)["package.json"]
				return f
			})
			ok(await matcherContextRemovePath(c, o, "package.json"))

			// NPM will use gitignore
			const newc = <MatcherContext>{
				depthPaths: new Map<string, number>([
					["src/patterns", 3],
					["src/targets", 3],
				]),
				external: new Map<string, Source>([
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
				paths: new Map<string, SignedPatternMatch>([
					["LICENSE.txt", { kind: "internal", ignored: false, pattern: "LICENSE*" }],
					["src/", { kind: "no-match", ignored: false }],
					["src/index.ts", { kind: "no-match", ignored: false }],
					["src/patterns/", { kind: "no-match", ignored: false }],
					["src/targets/", { kind: "no-match", ignored: false }],
					["tsconfig.prod.json", { kind: "no-match", ignored: false }],
				]),
				failed: [],
				totalDirs: -1,
				totalFiles: -1,
				totalMatchedFiles: -1,
			}
			debugger
			deepEqual(c, newc)
		})
	})
})
