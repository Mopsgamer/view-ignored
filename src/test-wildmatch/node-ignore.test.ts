/* oxlint-disable */
// Port of the complete node-ignore unit test suite.
// Reference: https://github.com/kaelzhang/node-ignore/blob/3823b5f14bb16b358397c94172bd5741dd2d7bec/test/fixtures/cases.js
// Reference: https://github.com/kaelzhang/node-ignore/blob/3823b5f14bb16b358397c94172bd5741dd2d7bec/test/ignore.test.js

import type { FsAdapter } from "../types.js"

import { describe, test, expect } from "bun:test"
import { createFsFromVolume, Volume } from "memfs"

import { scan } from "../browser_scan.js"
import { makeGit } from "../targets/git.js"

const BOM_CONTENT = "\ufeffnode_modules"

const AIGNORE_CONTENT = `abc
!abc/b
#e
\\#f`

const IGNORE_ISSUE_2_CONTENT = `# git-ls-files --others --exclude-from=.git/info/exclude
# Lines that start with '#' are comments.
# For a project mostly in C, the following would be a good set of
# exclude patterns (uncomment them if you want to use them):
# *.[oa]
# *~

/.project

# The same type as '/.project'
# /.settings

/sharedTools/external/*

thumbs.db

/packs

*.pyc

# /.cache

# /bigtxt
.metadata/*

*~

/sharedTools/jsApiLua.lua

._*

.DS_Store

# /DISABLED

# /.pydevproject

# /testbox

*.swp

/packs/packagesTree

/packs/*.ini

# .buildpath

# The same type as '/sharedTools/external/*'
# /resources/hooks/*

# .idea

.idea/*

# /tags

**.iml

.sonar/*

.*.sw?`

function createAdapter(vol: Volume): FsAdapter {
	const fs = createFsFromVolume(vol) as any
	return {
		readFile: fs.readFile.bind(fs),
		readdir: fs.readdir.bind(fs),
		stat: fs.stat.bind(fs),
	}
}

function buildTree(paths: string[]): any {
	const tree: any = {}
	for (const p of paths) {
		const isDir = p.endsWith("/")
		const cleaned = isDir ? p.slice(0, -1) : p
		const parts = cleaned.split("/")
		let current = tree
		for (let i = 0; i < parts.length; i++) {
			const part = parts[i]
			if (part === undefined || part === "") continue
			const isLast = i === parts.length - 1
			if (isLast) {
				if (isDir) {
					current[part] = current[part] || {}
				} else {
					current[part] = ""
				}
			} else {
				current[part] = current[part] || {}
				current = current[part]
			}
		}
	}
	return tree
}

describe.skipIf(!process.env.TEST_NODEIGNORE)("node-ignore compatibility tests", () => {
	test("#153: reinclude issue", async () => {
		const patterns = ["/a/**", "!/a/**/b.js "]
		const gitignoreContent = patterns.join("\n")
		const allPaths = ["a/c.d/b.js", "a/cd/b.js"]
		const tree = buildTree(allPaths)

		tree[".gitignore"] = gitignoreContent

		const vol = Volume.fromNestedJSON(tree, "/workspace")
		const adapter = createAdapter(vol)

		const scanResult = await scan({
			cwd: "/workspace",
			fs: adapter,
			target: makeGit(),
			dirs: true,
			depth: Infinity,
			invert: 2,
		})

		{
			const match = scanResult.paths.get("a/c.d/b.js")
			const isIgnored = match ? match.ignored : false
			expect(isIgnored).toBe(true)
		}
		{
			const match = scanResult.paths.get("a/cd/b.js")
			const isIgnored = match ? match.ignored : false
			expect(isIgnored).toBe(true)
		}
	})

	test("#148", async () => {
		const patterns = ["/.a/"]
		const gitignoreContent = patterns.join("\n")
		const allPaths = [".a"]
		const tree = buildTree(allPaths)

		tree[".gitignore"] = gitignoreContent

		const vol = Volume.fromNestedJSON(tree, "/workspace")
		const adapter = createAdapter(vol)

		const scanResult = await scan({
			cwd: "/workspace",
			fs: adapter,
			target: makeGit(),
			dirs: true,
			depth: Infinity,
			invert: 2,
		})

		{
			const match = scanResult.paths.get(".a")
			const isIgnored = match ? match.ignored : false
			expect(isIgnored).toBe(false)
		}
	})

	test("#77: more cases for coverage", async () => {
		const patterns = ["/*"]
		const gitignoreContent = patterns.join("\n")
		const allPaths = ["a", "a/", "a/b/"]
		const tree = buildTree(allPaths)

		tree[".gitignore"] = gitignoreContent

		const vol = Volume.fromNestedJSON(tree, "/workspace")
		const adapter = createAdapter(vol)

		const scanResult = await scan({
			cwd: "/workspace",
			fs: adapter,
			target: makeGit(),
			dirs: true,
			depth: Infinity,
			invert: 2,
		})

		{
			const match = scanResult.paths.get("a")
			const isIgnored = match ? match.ignored : false
			expect(isIgnored).toBe(true)
		}
		{
			const match = scanResult.paths.get("a/")
			const isIgnored = match ? match.ignored : false
			expect(isIgnored).toBe(true)
		}
		{
			const match = scanResult.paths.get("a/b/")
			const isIgnored = match ? match.ignored : false
			expect(isIgnored).toBe(true)
		}
	})

	test("#77: directory ending with / not always correctly ignored", async () => {
		const patterns = ["c/*", "foo/bar/*"]
		const gitignoreContent = patterns.join("\n")
		const allPaths = ["c/", "c", "foo/bar/", "foo/bar"]
		const tree = buildTree(allPaths)

		tree[".gitignore"] = gitignoreContent

		const vol = Volume.fromNestedJSON(tree, "/workspace")
		const adapter = createAdapter(vol)

		const scanResult = await scan({
			cwd: "/workspace",
			fs: adapter,
			target: makeGit(),
			dirs: true,
			depth: Infinity,
			invert: 2,
		})

		{
			const match = scanResult.paths.get("c/")
			const isIgnored = match ? match.ignored : false
			expect(isIgnored).toBe(true)
		}
		{
			const match = scanResult.paths.get("c")
			const isIgnored = match ? match.ignored : false
			expect(isIgnored).toBe(false)
		}
		{
			const match = scanResult.paths.get("foo/bar/")
			const isIgnored = match ? match.ignored : false
			expect(isIgnored).toBe(true)
		}
		{
			const match = scanResult.paths.get("foo/bar")
			const isIgnored = match ? match.ignored : false
			expect(isIgnored).toBe(false)
		}
	})

	test("#108: gitignore rules with BOM", async () => {
		const patterns = BOM_CONTENT.split("\n")
		const gitignoreContent = patterns.join("\n")
		const allPaths = ["node_modules"]
		const tree = buildTree(allPaths)

		tree[".gitignore"] = gitignoreContent

		const vol = Volume.fromNestedJSON(tree, "/workspace")
		const adapter = createAdapter(vol)

		const scanResult = await scan({
			cwd: "/workspace",
			fs: adapter,
			target: makeGit(),
			dirs: true,
			depth: Infinity,
			invert: 2,
		})

		{
			const match = scanResult.paths.get("node_modules")
			const isIgnored = match ? match.ignored : false
			expect(isIgnored).toBe(true)
		}
	})

	test("charactor ?", async () => {
		const patterns = ["foo?bar"]
		const gitignoreContent = patterns.join("\n")
		const allPaths = ["foo/bar", "fooxbar", "fooxxbar"]
		const tree = buildTree(allPaths)

		tree[".gitignore"] = gitignoreContent

		const vol = Volume.fromNestedJSON(tree, "/workspace")
		const adapter = createAdapter(vol)

		const scanResult = await scan({
			cwd: "/workspace",
			fs: adapter,
			target: makeGit(),
			dirs: true,
			depth: Infinity,
			invert: 2,
		})

		{
			const match = scanResult.paths.get("foo/bar")
			const isIgnored = match ? match.ignored : false
			expect(isIgnored).toBe(false)
		}
		{
			const match = scanResult.paths.get("fooxbar")
			const isIgnored = match ? match.ignored : false
			expect(isIgnored).toBe(true)
		}
		{
			const match = scanResult.paths.get("fooxxbar")
			const isIgnored = match ? match.ignored : false
			expect(isIgnored).toBe(false)
		}
	})

	test("#57, normal * and normal consecutive *", async () => {
		const patterns = ["**foo", "*bar", "ba*z", "folder/other-folder/**/**js"]
		const gitignoreContent = patterns.join("\n")
		const allPaths = [
			"foo",
			"a/foo",
			"afoo",
			"abfoo",
			"abcfoo",
			"bar",
			"abar",
			"baz",
			"ba/z",
			"baaaaaaz",
			"folder/other-folder/dir/main.js",
		]
		const tree = buildTree(allPaths)

		tree[".gitignore"] = gitignoreContent

		const vol = Volume.fromNestedJSON(tree, "/workspace")
		const adapter = createAdapter(vol)

		const scanResult = await scan({
			cwd: "/workspace",
			fs: adapter,
			target: makeGit(),
			dirs: true,
			depth: Infinity,
			invert: 2,
		})

		{
			const match = scanResult.paths.get("foo")
			const isIgnored = match ? match.ignored : false
			expect(isIgnored).toBe(true)
		}
		{
			const match = scanResult.paths.get("a/foo")
			const isIgnored = match ? match.ignored : false
			expect(isIgnored).toBe(true)
		}
		{
			const match = scanResult.paths.get("afoo")
			const isIgnored = match ? match.ignored : false
			expect(isIgnored).toBe(true)
		}
		{
			const match = scanResult.paths.get("abfoo")
			const isIgnored = match ? match.ignored : false
			expect(isIgnored).toBe(true)
		}
		{
			const match = scanResult.paths.get("abcfoo")
			const isIgnored = match ? match.ignored : false
			expect(isIgnored).toBe(true)
		}
		{
			const match = scanResult.paths.get("bar")
			const isIgnored = match ? match.ignored : false
			expect(isIgnored).toBe(true)
		}
		{
			const match = scanResult.paths.get("abar")
			const isIgnored = match ? match.ignored : false
			expect(isIgnored).toBe(true)
		}
		{
			const match = scanResult.paths.get("baz")
			const isIgnored = match ? match.ignored : false
			expect(isIgnored).toBe(true)
		}
		{
			const match = scanResult.paths.get("ba/z")
			const isIgnored = match ? match.ignored : false
			expect(isIgnored).toBe(false)
		}
		{
			const match = scanResult.paths.get("baaaaaaz")
			const isIgnored = match ? match.ignored : false
			expect(isIgnored).toBe(true)
		}
		{
			const match = scanResult.paths.get("folder/other-folder/dir/main.js")
			const isIgnored = match ? match.ignored : false
			expect(isIgnored).toBe(true)
		}
	})

	test("#76 (invalid), comments with no heading whitespace", async () => {
		const patterns = ["node_modules# comments"]
		const gitignoreContent = patterns.join("\n")
		const allPaths = ["node_modules/a.js"]
		const tree = buildTree(allPaths)

		tree[".gitignore"] = gitignoreContent

		const vol = Volume.fromNestedJSON(tree, "/workspace")
		const adapter = createAdapter(vol)

		const scanResult = await scan({
			cwd: "/workspace",
			fs: adapter,
			target: makeGit(),
			dirs: true,
			depth: Infinity,
			invert: 2,
		})

		{
			const match = scanResult.paths.get("node_modules/a.js")
			const isIgnored = match ? match.ignored : false
			expect(isIgnored).toBe(false)
		}
	})

	test("#59 and more cases about range notation", async () => {
		const patterns = [
			"src/\\[foo\\]",
			"src/\\[bar]",
			"src/[e\\\\]",
			"s/[f\\\\\\\\]",
			"s/[a-z0-9]",
			"src/[q",
			"src/\\[u",
			"src/[x\\]",
		]
		const gitignoreContent = patterns.join("\n")
		const allPaths = [
			"src/[foo]",
			"src/[bar]",
			"src/e",
			"s/f",
			"s/a",
			"s/0",
			"src/[q",
			"src/[u",
			"src/[x",
			"src/[x]",
			"src/x",
		]
		const tree = buildTree(allPaths)

		tree[".gitignore"] = gitignoreContent

		const vol = Volume.fromNestedJSON(tree, "/workspace")
		const adapter = createAdapter(vol)

		const scanResult = await scan({
			cwd: "/workspace",
			fs: adapter,
			target: makeGit(),
			dirs: true,
			depth: Infinity,
			invert: 2,
		})

		{
			const match = scanResult.paths.get("src/[foo]")
			const isIgnored = match ? match.ignored : false
			expect(isIgnored).toBe(true)
		}
		{
			const match = scanResult.paths.get("src/[bar]")
			const isIgnored = match ? match.ignored : false
			expect(isIgnored).toBe(true)
		}
		{
			const match = scanResult.paths.get("src/e")
			const isIgnored = match ? match.ignored : false
			expect(isIgnored).toBe(true)
		}
		{
			const match = scanResult.paths.get("s/f")
			const isIgnored = match ? match.ignored : false
			expect(isIgnored).toBe(true)
		}
		{
			const match = scanResult.paths.get("s/a")
			const isIgnored = match ? match.ignored : false
			expect(isIgnored).toBe(true)
		}
		{
			const match = scanResult.paths.get("s/0")
			const isIgnored = match ? match.ignored : false
			expect(isIgnored).toBe(true)
		}
		{
			const match = scanResult.paths.get("src/[q")
			const isIgnored = match ? match.ignored : false
			expect(isIgnored).toBe(false)
		}
		{
			const match = scanResult.paths.get("src/[u")
			const isIgnored = match ? match.ignored : false
			expect(isIgnored).toBe(true)
		}
		{
			const match = scanResult.paths.get("src/[x")
			const isIgnored = match ? match.ignored : false
			expect(isIgnored).toBe(false)
		}
		{
			const match = scanResult.paths.get("src/[x]")
			const isIgnored = match ? match.ignored : false
			expect(isIgnored).toBe(false)
		}
		{
			const match = scanResult.paths.get("src/x")
			const isIgnored = match ? match.ignored : false
			expect(isIgnored).toBe(false)
		}
	})

	test("gitignore 2.22.1 example", async () => {
		const patterns = ["doc/frotz/"]
		const gitignoreContent = patterns.join("\n")
		const allPaths = ["doc/frotz/", "a/doc/frotz/"]
		const tree = buildTree(allPaths)

		tree[".gitignore"] = gitignoreContent

		const vol = Volume.fromNestedJSON(tree, "/workspace")
		const adapter = createAdapter(vol)

		const scanResult = await scan({
			cwd: "/workspace",
			fs: adapter,
			target: makeGit(),
			dirs: true,
			depth: Infinity,
			invert: 2,
		})

		{
			const match = scanResult.paths.get("doc/frotz/")
			const isIgnored = match ? match.ignored : false
			expect(isIgnored).toBe(true)
		}
		{
			const match = scanResult.paths.get("a/doc/frotz/")
			const isIgnored = match ? match.ignored : false
			expect(isIgnored).toBe(false)
		}
	})

	test("#56", async () => {
		const patterns = ["/*/", "!/foo/"]
		const gitignoreContent = patterns.join("\n")
		const allPaths = ["foo/bar.js"]
		const tree = buildTree(allPaths)

		tree[".gitignore"] = gitignoreContent

		const vol = Volume.fromNestedJSON(tree, "/workspace")
		const adapter = createAdapter(vol)

		const scanResult = await scan({
			cwd: "/workspace",
			fs: adapter,
			target: makeGit(),
			dirs: true,
			depth: Infinity,
			invert: 2,
		})

		{
			const match = scanResult.paths.get("foo/bar.js")
			const isIgnored = match ? match.ignored : false
			expect(isIgnored).toBe(false)
		}
	})

	test("object prototype", async () => {
		const patterns = ["*", "!hasOwnProperty", "!a"]
		const gitignoreContent = patterns.join("\n")
		const allPaths = ["hasOwnProperty", "a/hasOwnProperty", "toString", "a/toString"]
		const tree = buildTree(allPaths)

		tree[".gitignore"] = gitignoreContent

		const vol = Volume.fromNestedJSON(tree, "/workspace")
		const adapter = createAdapter(vol)

		const scanResult = await scan({
			cwd: "/workspace",
			fs: adapter,
			target: makeGit(),
			dirs: true,
			depth: Infinity,
			invert: 2,
		})

		{
			const match = scanResult.paths.get("hasOwnProperty")
			const isIgnored = match ? match.ignored : false
			expect(isIgnored).toBe(false)
		}
		{
			const match = scanResult.paths.get("a/hasOwnProperty")
			const isIgnored = match ? match.ignored : false
			expect(isIgnored).toBe(false)
		}
		{
			const match = scanResult.paths.get("toString")
			const isIgnored = match ? match.ignored : false
			expect(isIgnored).toBe(true)
		}
		{
			const match = scanResult.paths.get("a/toString")
			const isIgnored = match ? match.ignored : false
			expect(isIgnored).toBe(true)
		}
	})

	test("a and a/", async () => {
		const patterns = ["a", "a2", "b/", "b2/"]
		const gitignoreContent = patterns.join("\n")
		const allPaths = ["a", "a2/", "b", "b2/"]
		const tree = buildTree(allPaths)

		tree[".gitignore"] = gitignoreContent

		const vol = Volume.fromNestedJSON(tree, "/workspace")
		const adapter = createAdapter(vol)

		const scanResult = await scan({
			cwd: "/workspace",
			fs: adapter,
			target: makeGit(),
			dirs: true,
			depth: Infinity,
			invert: 2,
		})

		{
			const match = scanResult.paths.get("a")
			const isIgnored = match ? match.ignored : false
			expect(isIgnored).toBe(true)
		}
		{
			const match = scanResult.paths.get("a2/")
			const isIgnored = match ? match.ignored : false
			expect(isIgnored).toBe(true)
		}
		{
			const match = scanResult.paths.get("b")
			const isIgnored = match ? match.ignored : false
			expect(isIgnored).toBe(false)
		}
		{
			const match = scanResult.paths.get("b2/")
			const isIgnored = match ? match.ignored : false
			expect(isIgnored).toBe(true)
		}
	})

	test("ending question mark", async () => {
		const patterns = ["*.web?"]
		const gitignoreContent = patterns.join("\n")
		const allPaths = ["a.webp", "a.webm", "a.webam", "a.png"]
		const tree = buildTree(allPaths)

		tree[".gitignore"] = gitignoreContent

		const vol = Volume.fromNestedJSON(tree, "/workspace")
		const adapter = createAdapter(vol)

		const scanResult = await scan({
			cwd: "/workspace",
			fs: adapter,
			target: makeGit(),
			dirs: true,
			depth: Infinity,
			invert: 2,
		})

		{
			const match = scanResult.paths.get("a.webp")
			const isIgnored = match ? match.ignored : false
			expect(isIgnored).toBe(true)
		}
		{
			const match = scanResult.paths.get("a.webm")
			const isIgnored = match ? match.ignored : false
			expect(isIgnored).toBe(true)
		}
		{
			const match = scanResult.paths.get("a.webam")
			const isIgnored = match ? match.ignored : false
			expect(isIgnored).toBe(false)
		}
		{
			const match = scanResult.paths.get("a.png")
			const isIgnored = match ? match.ignored : false
			expect(isIgnored).toBe(false)
		}
	})

	test("intermediate question mark", async () => {
		const patterns = ["a?c"]
		const gitignoreContent = patterns.join("\n")
		const allPaths = ["abc", "acc", "ac", "abbc"]
		const tree = buildTree(allPaths)

		tree[".gitignore"] = gitignoreContent

		const vol = Volume.fromNestedJSON(tree, "/workspace")
		const adapter = createAdapter(vol)

		const scanResult = await scan({
			cwd: "/workspace",
			fs: adapter,
			target: makeGit(),
			dirs: true,
			depth: Infinity,
			invert: 2,
		})

		{
			const match = scanResult.paths.get("abc")
			const isIgnored = match ? match.ignored : false
			expect(isIgnored).toBe(true)
		}
		{
			const match = scanResult.paths.get("acc")
			const isIgnored = match ? match.ignored : false
			expect(isIgnored).toBe(true)
		}
		{
			const match = scanResult.paths.get("ac")
			const isIgnored = match ? match.ignored : false
			expect(isIgnored).toBe(false)
		}
		{
			const match = scanResult.paths.get("abbc")
			const isIgnored = match ? match.ignored : false
			expect(isIgnored).toBe(false)
		}
	})

	test("multiple question marks", async () => {
		const patterns = ["a?b??"]
		const gitignoreContent = patterns.join("\n")
		const allPaths = ["acbdd", "acbddd"]
		const tree = buildTree(allPaths)

		tree[".gitignore"] = gitignoreContent

		const vol = Volume.fromNestedJSON(tree, "/workspace")
		const adapter = createAdapter(vol)

		const scanResult = await scan({
			cwd: "/workspace",
			fs: adapter,
			target: makeGit(),
			dirs: true,
			depth: Infinity,
			invert: 2,
		})

		{
			const match = scanResult.paths.get("acbdd")
			const isIgnored = match ? match.ignored : false
			expect(isIgnored).toBe(true)
		}
		{
			const match = scanResult.paths.get("acbddd")
			const isIgnored = match ? match.ignored : false
			expect(isIgnored).toBe(false)
		}
	})

	test("normal *.[oa]", async () => {
		const patterns = ["*.[oa]"]
		const gitignoreContent = patterns.join("\n")
		const allPaths = ["a.js", "a.a", "a.aa", "a.o", "a.0"]
		const tree = buildTree(allPaths)

		tree[".gitignore"] = gitignoreContent

		const vol = Volume.fromNestedJSON(tree, "/workspace")
		const adapter = createAdapter(vol)

		const scanResult = await scan({
			cwd: "/workspace",
			fs: adapter,
			target: makeGit(),
			dirs: true,
			depth: Infinity,
			invert: 2,
		})

		{
			const match = scanResult.paths.get("a.js")
			const isIgnored = match ? match.ignored : false
			expect(isIgnored).toBe(false)
		}
		{
			const match = scanResult.paths.get("a.a")
			const isIgnored = match ? match.ignored : false
			expect(isIgnored).toBe(true)
		}
		{
			const match = scanResult.paths.get("a.aa")
			const isIgnored = match ? match.ignored : false
			expect(isIgnored).toBe(false)
		}
		{
			const match = scanResult.paths.get("a.o")
			const isIgnored = match ? match.ignored : false
			expect(isIgnored).toBe(true)
		}
		{
			const match = scanResult.paths.get("a.0")
			const isIgnored = match ? match.ignored : false
			expect(isIgnored).toBe(false)
		}
	})

	test("multiple brackets", async () => {
		const patterns = ["*.[ab][cd][ef]"]
		const gitignoreContent = patterns.join("\n")
		const allPaths = ["a.ace", "a.bdf", "a.bce", "a.abc", "a.aceg"]
		const tree = buildTree(allPaths)

		tree[".gitignore"] = gitignoreContent

		const vol = Volume.fromNestedJSON(tree, "/workspace")
		const adapter = createAdapter(vol)

		const scanResult = await scan({
			cwd: "/workspace",
			fs: adapter,
			target: makeGit(),
			dirs: true,
			depth: Infinity,
			invert: 2,
		})

		{
			const match = scanResult.paths.get("a.ace")
			const isIgnored = match ? match.ignored : false
			expect(isIgnored).toBe(true)
		}
		{
			const match = scanResult.paths.get("a.bdf")
			const isIgnored = match ? match.ignored : false
			expect(isIgnored).toBe(true)
		}
		{
			const match = scanResult.paths.get("a.bce")
			const isIgnored = match ? match.ignored : false
			expect(isIgnored).toBe(true)
		}
		{
			const match = scanResult.paths.get("a.abc")
			const isIgnored = match ? match.ignored : false
			expect(isIgnored).toBe(false)
		}
		{
			const match = scanResult.paths.get("a.aceg")
			const isIgnored = match ? match.ignored : false
			expect(isIgnored).toBe(false)
		}
	})

	test("special case: []", async () => {
		const patterns = ["*.[]"]
		const gitignoreContent = patterns.join("\n")
		const allPaths = ["a.[]", "a.[]a"]
		const tree = buildTree(allPaths)

		tree[".gitignore"] = gitignoreContent

		const vol = Volume.fromNestedJSON(tree, "/workspace")
		const adapter = createAdapter(vol)

		const scanResult = await scan({
			cwd: "/workspace",
			fs: adapter,
			target: makeGit(),
			dirs: true,
			depth: Infinity,
			invert: 2,
		})

		{
			const match = scanResult.paths.get("a.[]")
			const isIgnored = match ? match.ignored : false
			expect(isIgnored).toBe(false)
		}
		{
			const match = scanResult.paths.get("a.[]a")
			const isIgnored = match ? match.ignored : false
			expect(isIgnored).toBe(false)
		}
	})

	test("mixed with numbers, characters and symbols: *.[0a_]", async () => {
		const patterns = ["*.[0a_]"]
		const gitignoreContent = patterns.join("\n")
		const allPaths = ["a.0", "a.1", "a.a", "a.b", "a._", "a.="]
		const tree = buildTree(allPaths)

		tree[".gitignore"] = gitignoreContent

		const vol = Volume.fromNestedJSON(tree, "/workspace")
		const adapter = createAdapter(vol)

		const scanResult = await scan({
			cwd: "/workspace",
			fs: adapter,
			target: makeGit(),
			dirs: true,
			depth: Infinity,
			invert: 2,
		})

		{
			const match = scanResult.paths.get("a.0")
			const isIgnored = match ? match.ignored : false
			expect(isIgnored).toBe(true)
		}
		{
			const match = scanResult.paths.get("a.1")
			const isIgnored = match ? match.ignored : false
			expect(isIgnored).toBe(false)
		}
		{
			const match = scanResult.paths.get("a.a")
			const isIgnored = match ? match.ignored : false
			expect(isIgnored).toBe(true)
		}
		{
			const match = scanResult.paths.get("a.b")
			const isIgnored = match ? match.ignored : false
			expect(isIgnored).toBe(false)
		}
		{
			const match = scanResult.paths.get("a._")
			const isIgnored = match ? match.ignored : false
			expect(isIgnored).toBe(true)
		}
		{
			const match = scanResult.paths.get("a.=")
			const isIgnored = match ? match.ignored : false
			expect(isIgnored).toBe(false)
		}
	})

	test("range: [a-z]", async () => {
		const patterns = ["*.pn[a-z]"]
		const gitignoreContent = patterns.join("\n")
		const allPaths = ["a.pn1", "a.pn2", "a.png", "a.pna"]
		const tree = buildTree(allPaths)

		tree[".gitignore"] = gitignoreContent

		const vol = Volume.fromNestedJSON(tree, "/workspace")
		const adapter = createAdapter(vol)

		const scanResult = await scan({
			cwd: "/workspace",
			fs: adapter,
			target: makeGit(),
			dirs: true,
			depth: Infinity,
			invert: 2,
		})

		{
			const match = scanResult.paths.get("a.pn1")
			const isIgnored = match ? match.ignored : false
			expect(isIgnored).toBe(false)
		}
		{
			const match = scanResult.paths.get("a.pn2")
			const isIgnored = match ? match.ignored : false
			expect(isIgnored).toBe(false)
		}
		{
			const match = scanResult.paths.get("a.png")
			const isIgnored = match ? match.ignored : false
			expect(isIgnored).toBe(true)
		}
		{
			const match = scanResult.paths.get("a.pna")
			const isIgnored = match ? match.ignored : false
			expect(isIgnored).toBe(true)
		}
	})

	test("range: [0-9]", async () => {
		const patterns = ["*.pn[0-9]"]
		const gitignoreContent = patterns.join("\n")
		const allPaths = ["a.pn1", "a.pn2", "a.png", "a.pna"]
		const tree = buildTree(allPaths)

		tree[".gitignore"] = gitignoreContent

		const vol = Volume.fromNestedJSON(tree, "/workspace")
		const adapter = createAdapter(vol)

		const scanResult = await scan({
			cwd: "/workspace",
			fs: adapter,
			target: makeGit(),
			dirs: true,
			depth: Infinity,
			invert: 2,
		})

		{
			const match = scanResult.paths.get("a.pn1")
			const isIgnored = match ? match.ignored : false
			expect(isIgnored).toBe(true)
		}
		{
			const match = scanResult.paths.get("a.pn2")
			const isIgnored = match ? match.ignored : false
			expect(isIgnored).toBe(true)
		}
		{
			const match = scanResult.paths.get("a.png")
			const isIgnored = match ? match.ignored : false
			expect(isIgnored).toBe(false)
		}
		{
			const match = scanResult.paths.get("a.pna")
			const isIgnored = match ? match.ignored : false
			expect(isIgnored).toBe(false)
		}
	})

	test("multiple ranges: [0-9a-z]", async () => {
		const patterns = ["*.pn[0-9a-z]"]
		const gitignoreContent = patterns.join("\n")
		const allPaths = ["a.pn1", "a.pn2", "a.png", "a.pna", "a.pn-"]
		const tree = buildTree(allPaths)

		tree[".gitignore"] = gitignoreContent

		const vol = Volume.fromNestedJSON(tree, "/workspace")
		const adapter = createAdapter(vol)

		const scanResult = await scan({
			cwd: "/workspace",
			fs: adapter,
			target: makeGit(),
			dirs: true,
			depth: Infinity,
			invert: 2,
		})

		{
			const match = scanResult.paths.get("a.pn1")
			const isIgnored = match ? match.ignored : false
			expect(isIgnored).toBe(true)
		}
		{
			const match = scanResult.paths.get("a.pn2")
			const isIgnored = match ? match.ignored : false
			expect(isIgnored).toBe(true)
		}
		{
			const match = scanResult.paths.get("a.png")
			const isIgnored = match ? match.ignored : false
			expect(isIgnored).toBe(true)
		}
		{
			const match = scanResult.paths.get("a.pna")
			const isIgnored = match ? match.ignored : false
			expect(isIgnored).toBe(true)
		}
		{
			const match = scanResult.paths.get("a.pn-")
			const isIgnored = match ? match.ignored : false
			expect(isIgnored).toBe(false)
		}
	})

	test("special range: [0-z]", async () => {
		const patterns = ["*.[0-z]"]
		const gitignoreContent = patterns.join("\n")
		const allPaths = ["a.0", "a.9", "a.00", "a.a", "a.z", "a.zz"]
		const tree = buildTree(allPaths)

		tree[".gitignore"] = gitignoreContent

		const vol = Volume.fromNestedJSON(tree, "/workspace")
		const adapter = createAdapter(vol)

		const scanResult = await scan({
			cwd: "/workspace",
			fs: adapter,
			target: makeGit(),
			dirs: true,
			depth: Infinity,
			invert: 2,
		})

		{
			const match = scanResult.paths.get("a.0")
			const isIgnored = match ? match.ignored : false
			expect(isIgnored).toBe(true)
		}
		{
			const match = scanResult.paths.get("a.9")
			const isIgnored = match ? match.ignored : false
			expect(isIgnored).toBe(true)
		}
		{
			const match = scanResult.paths.get("a.00")
			const isIgnored = match ? match.ignored : false
			expect(isIgnored).toBe(false)
		}
		{
			const match = scanResult.paths.get("a.a")
			const isIgnored = match ? match.ignored : false
			expect(isIgnored).toBe(true)
		}
		{
			const match = scanResult.paths.get("a.z")
			const isIgnored = match ? match.ignored : false
			expect(isIgnored).toBe(true)
		}
		{
			const match = scanResult.paths.get("a.zz")
			const isIgnored = match ? match.ignored : false
			expect(isIgnored).toBe(false)
		}
	})

	test("special case: range out of order: [a-9]", async () => {
		const patterns = ["*.[a-9]"]
		const gitignoreContent = patterns.join("\n")
		const allPaths = ["a.0", "a.-", "a.9"]
		const tree = buildTree(allPaths)

		tree[".gitignore"] = gitignoreContent

		const vol = Volume.fromNestedJSON(tree, "/workspace")
		const adapter = createAdapter(vol)

		const scanResult = await scan({
			cwd: "/workspace",
			fs: adapter,
			target: makeGit(),
			dirs: true,
			depth: Infinity,
			invert: 2,
		})

		{
			const match = scanResult.paths.get("a.0")
			const isIgnored = match ? match.ignored : false
			expect(isIgnored).toBe(false)
		}
		{
			const match = scanResult.paths.get("a.-")
			const isIgnored = match ? match.ignored : false
			expect(isIgnored).toBe(false)
		}
		{
			const match = scanResult.paths.get("a.9")
			const isIgnored = match ? match.ignored : false
			expect(isIgnored).toBe(false)
		}
	})

	test("special case: range-like character set", async () => {
		const patterns = ["*.[a-]"]
		const gitignoreContent = patterns.join("\n")
		const allPaths = ["a.a", "a.-", "a.b"]
		const tree = buildTree(allPaths)

		tree[".gitignore"] = gitignoreContent

		const vol = Volume.fromNestedJSON(tree, "/workspace")
		const adapter = createAdapter(vol)

		const scanResult = await scan({
			cwd: "/workspace",
			fs: adapter,
			target: makeGit(),
			dirs: true,
			depth: Infinity,
			invert: 2,
		})

		{
			const match = scanResult.paths.get("a.a")
			const isIgnored = match ? match.ignored : false
			expect(isIgnored).toBe(true)
		}
		{
			const match = scanResult.paths.get("a.-")
			const isIgnored = match ? match.ignored : false
			expect(isIgnored).toBe(true)
		}
		{
			const match = scanResult.paths.get("a.b")
			const isIgnored = match ? match.ignored : false
			expect(isIgnored).toBe(false)
		}
	})

	test("special case: the combination of range and set", async () => {
		const patterns = ["*.[a-z01]"]
		const gitignoreContent = patterns.join("\n")
		const allPaths = ["a.a", "a.b", "a.z", "a.0", "a.1", "a.2"]
		const tree = buildTree(allPaths)

		tree[".gitignore"] = gitignoreContent

		const vol = Volume.fromNestedJSON(tree, "/workspace")
		const adapter = createAdapter(vol)

		const scanResult = await scan({
			cwd: "/workspace",
			fs: adapter,
			target: makeGit(),
			dirs: true,
			depth: Infinity,
			invert: 2,
		})

		{
			const match = scanResult.paths.get("a.a")
			const isIgnored = match ? match.ignored : false
			expect(isIgnored).toBe(true)
		}
		{
			const match = scanResult.paths.get("a.b")
			const isIgnored = match ? match.ignored : false
			expect(isIgnored).toBe(true)
		}
		{
			const match = scanResult.paths.get("a.z")
			const isIgnored = match ? match.ignored : false
			expect(isIgnored).toBe(true)
		}
		{
			const match = scanResult.paths.get("a.0")
			const isIgnored = match ? match.ignored : false
			expect(isIgnored).toBe(true)
		}
		{
			const match = scanResult.paths.get("a.1")
			const isIgnored = match ? match.ignored : false
			expect(isIgnored).toBe(true)
		}
		{
			const match = scanResult.paths.get("a.2")
			const isIgnored = match ? match.ignored : false
			expect(isIgnored).toBe(false)
		}
	})

	test("special case: 1 step range", async () => {
		const patterns = ["*.[0-0]"]
		const gitignoreContent = patterns.join("\n")
		const allPaths = ["a.0", "a.1", "a.-"]
		const tree = buildTree(allPaths)

		tree[".gitignore"] = gitignoreContent

		const vol = Volume.fromNestedJSON(tree, "/workspace")
		const adapter = createAdapter(vol)

		const scanResult = await scan({
			cwd: "/workspace",
			fs: adapter,
			target: makeGit(),
			dirs: true,
			depth: Infinity,
			invert: 2,
		})

		{
			const match = scanResult.paths.get("a.0")
			const isIgnored = match ? match.ignored : false
			expect(isIgnored).toBe(true)
		}
		{
			const match = scanResult.paths.get("a.1")
			const isIgnored = match ? match.ignored : false
			expect(isIgnored).toBe(false)
		}
		{
			const match = scanResult.paths.get("a.-")
			const isIgnored = match ? match.ignored : false
			expect(isIgnored).toBe(false)
		}
	})

	test("negated class: [!a].txt", async () => {
		const patterns = ["[!a].txt"]
		const gitignoreContent = patterns.join("\n")
		const allPaths = ["a.txt", "b.txt"]
		const tree = buildTree(allPaths)

		tree[".gitignore"] = gitignoreContent

		const vol = Volume.fromNestedJSON(tree, "/workspace")
		const adapter = createAdapter(vol)

		const scanResult = await scan({
			cwd: "/workspace",
			fs: adapter,
			target: makeGit(),
			dirs: true,
			depth: Infinity,
			invert: 2,
		})

		{
			const match = scanResult.paths.get("a.txt")
			const isIgnored = match ? match.ignored : false
			expect(isIgnored).toBe(false)
		}
		{
			const match = scanResult.paths.get("b.txt")
			const isIgnored = match ? match.ignored : false
			expect(isIgnored).toBe(true)
		}
	})

	test("negated class with caret: [^a]", async () => {
		const patterns = ["[^a]"]
		const gitignoreContent = patterns.join("\n")
		const allPaths = ["a", "b"]
		const tree = buildTree(allPaths)

		tree[".gitignore"] = gitignoreContent

		const vol = Volume.fromNestedJSON(tree, "/workspace")
		const adapter = createAdapter(vol)

		const scanResult = await scan({
			cwd: "/workspace",
			fs: adapter,
			target: makeGit(),
			dirs: true,
			depth: Infinity,
			invert: 2,
		})

		{
			const match = scanResult.paths.get("a")
			const isIgnored = match ? match.ignored : false
			expect(isIgnored).toBe(false)
		}
		{
			const match = scanResult.paths.get("b")
			const isIgnored = match ? match.ignored : false
			expect(isIgnored).toBe(true)
		}
	})

	test("negated range: [!a-c].txt", async () => {
		const patterns = ["[!a-c].txt"]
		const gitignoreContent = patterns.join("\n")
		const allPaths = ["a.txt", "b.txt", "c.txt", "d.txt"]
		const tree = buildTree(allPaths)

		tree[".gitignore"] = gitignoreContent

		const vol = Volume.fromNestedJSON(tree, "/workspace")
		const adapter = createAdapter(vol)

		const scanResult = await scan({
			cwd: "/workspace",
			fs: adapter,
			target: makeGit(),
			dirs: true,
			depth: Infinity,
			invert: 2,
		})

		{
			const match = scanResult.paths.get("a.txt")
			const isIgnored = match ? match.ignored : false
			expect(isIgnored).toBe(false)
		}
		{
			const match = scanResult.paths.get("b.txt")
			const isIgnored = match ? match.ignored : false
			expect(isIgnored).toBe(false)
		}
		{
			const match = scanResult.paths.get("c.txt")
			const isIgnored = match ? match.ignored : false
			expect(isIgnored).toBe(false)
		}
		{
			const match = scanResult.paths.get("d.txt")
			const isIgnored = match ? match.ignored : false
			expect(isIgnored).toBe(true)
		}
	})

	test("negated numeric range: [!0-9]", async () => {
		const patterns = ["[!0-9]"]
		const gitignoreContent = patterns.join("\n")
		const allPaths = ["0", "5", "9", "a"]
		const tree = buildTree(allPaths)

		tree[".gitignore"] = gitignoreContent

		const vol = Volume.fromNestedJSON(tree, "/workspace")
		const adapter = createAdapter(vol)

		const scanResult = await scan({
			cwd: "/workspace",
			fs: adapter,
			target: makeGit(),
			dirs: true,
			depth: Infinity,
			invert: 2,
		})

		{
			const match = scanResult.paths.get("0")
			const isIgnored = match ? match.ignored : false
			expect(isIgnored).toBe(false)
		}
		{
			const match = scanResult.paths.get("5")
			const isIgnored = match ? match.ignored : false
			expect(isIgnored).toBe(false)
		}
		{
			const match = scanResult.paths.get("9")
			const isIgnored = match ? match.ignored : false
			expect(isIgnored).toBe(false)
		}
		{
			const match = scanResult.paths.get("a")
			const isIgnored = match ? match.ignored : false
			expect(isIgnored).toBe(true)
		}
	})

	test("negated class in the middle: x[!y]z", async () => {
		const patterns = ["x[!y]z"]
		const gitignoreContent = patterns.join("\n")
		const allPaths = ["xyz", "xaz", "xbz"]
		const tree = buildTree(allPaths)

		tree[".gitignore"] = gitignoreContent

		const vol = Volume.fromNestedJSON(tree, "/workspace")
		const adapter = createAdapter(vol)

		const scanResult = await scan({
			cwd: "/workspace",
			fs: adapter,
			target: makeGit(),
			dirs: true,
			depth: Infinity,
			invert: 2,
		})

		{
			const match = scanResult.paths.get("xyz")
			const isIgnored = match ? match.ignored : false
			expect(isIgnored).toBe(false)
		}
		{
			const match = scanResult.paths.get("xaz")
			const isIgnored = match ? match.ignored : false
			expect(isIgnored).toBe(true)
		}
		{
			const match = scanResult.paths.get("xbz")
			const isIgnored = match ? match.ignored : false
			expect(isIgnored).toBe(true)
		}
	})

	test("special case: similar, but not a character set", async () => {
		const patterns = ["*.[a-"]
		const gitignoreContent = patterns.join("\n")
		const allPaths = ["a.", "a.[", "a.a", "a.-"]
		const tree = buildTree(allPaths)

		tree[".gitignore"] = gitignoreContent

		const vol = Volume.fromNestedJSON(tree, "/workspace")
		const adapter = createAdapter(vol)

		const scanResult = await scan({
			cwd: "/workspace",
			fs: adapter,
			target: makeGit(),
			dirs: true,
			depth: Infinity,
			invert: 2,
		})

		{
			const match = scanResult.paths.get("a.")
			const isIgnored = match ? match.ignored : false
			expect(isIgnored).toBe(false)
		}
		{
			const match = scanResult.paths.get("a.[")
			const isIgnored = match ? match.ignored : false
			expect(isIgnored).toBe(false)
		}
		{
			const match = scanResult.paths.get("a.a")
			const isIgnored = match ? match.ignored : false
			expect(isIgnored).toBe(false)
		}
		{
			const match = scanResult.paths.get("a.-")
			const isIgnored = match ? match.ignored : false
			expect(isIgnored).toBe(false)
		}
	})

	test("related to #38", async () => {
		const patterns = ["*", "!abc*"]
		const gitignoreContent = patterns.join("\n")
		const allPaths = ["a", "abc", "abcd"]
		const tree = buildTree(allPaths)

		tree[".gitignore"] = gitignoreContent

		const vol = Volume.fromNestedJSON(tree, "/workspace")
		const adapter = createAdapter(vol)

		const scanResult = await scan({
			cwd: "/workspace",
			fs: adapter,
			target: makeGit(),
			dirs: true,
			depth: Infinity,
			invert: 2,
		})

		{
			const match = scanResult.paths.get("a")
			const isIgnored = match ? match.ignored : false
			expect(isIgnored).toBe(true)
		}
		{
			const match = scanResult.paths.get("abc")
			const isIgnored = match ? match.ignored : false
			expect(isIgnored).toBe(false)
		}
		{
			const match = scanResult.paths.get("abcd")
			const isIgnored = match ? match.ignored : false
			expect(isIgnored).toBe(false)
		}
	})

	test("#38", async () => {
		const patterns = ["*", "!*/", "!foo/bar"]
		const gitignoreContent = patterns.join("\n")
		const allPaths = ["a", "b/c", "foo/bar", "foo/e"]
		const tree = buildTree(allPaths)

		tree[".gitignore"] = gitignoreContent

		const vol = Volume.fromNestedJSON(tree, "/workspace")
		const adapter = createAdapter(vol)

		const scanResult = await scan({
			cwd: "/workspace",
			fs: adapter,
			target: makeGit(),
			dirs: true,
			depth: Infinity,
			invert: 2,
		})

		{
			const match = scanResult.paths.get("a")
			const isIgnored = match ? match.ignored : false
			expect(isIgnored).toBe(true)
		}
		{
			const match = scanResult.paths.get("b/c")
			const isIgnored = match ? match.ignored : false
			expect(isIgnored).toBe(true)
		}
		{
			const match = scanResult.paths.get("foo/bar")
			const isIgnored = match ? match.ignored : false
			expect(isIgnored).toBe(false)
		}
		{
			const match = scanResult.paths.get("foo/e")
			const isIgnored = match ? match.ignored : false
			expect(isIgnored).toBe(true)
		}
	})

	test('intermediate "\\ " should be unescaped to " "', async () => {
		const patterns = ["abc\\ d", "abc e", "a\\ b\\ c"]
		const gitignoreContent = patterns.join("\n")
		const allPaths = ["abc d", "abc e", "abc/abc d", "abc/abc e", "abc/a b c"]
		const tree = buildTree(allPaths)

		tree[".gitignore"] = gitignoreContent

		const vol = Volume.fromNestedJSON(tree, "/workspace")
		const adapter = createAdapter(vol)

		const scanResult = await scan({
			cwd: "/workspace",
			fs: adapter,
			target: makeGit(),
			dirs: true,
			depth: Infinity,
			invert: 2,
		})

		{
			const match = scanResult.paths.get("abc d")
			const isIgnored = match ? match.ignored : false
			expect(isIgnored).toBe(true)
		}
		{
			const match = scanResult.paths.get("abc e")
			const isIgnored = match ? match.ignored : false
			expect(isIgnored).toBe(true)
		}
		{
			const match = scanResult.paths.get("abc/abc d")
			const isIgnored = match ? match.ignored : false
			expect(isIgnored).toBe(true)
		}
		{
			const match = scanResult.paths.get("abc/abc e")
			const isIgnored = match ? match.ignored : false
			expect(isIgnored).toBe(true)
		}
		{
			const match = scanResult.paths.get("abc/a b c")
			const isIgnored = match ? match.ignored : false
			expect(isIgnored).toBe(true)
		}
	})

	test("#25", async () => {
		const patterns = [".git/*", "!.git/config", ".ftpconfig"]
		const gitignoreContent = patterns.join("\n")
		const allPaths = [".ftpconfig", ".git/config", ".git/description"]
		const tree = buildTree(allPaths)

		tree[".gitignore"] = gitignoreContent

		const vol = Volume.fromNestedJSON(tree, "/workspace")
		const adapter = createAdapter(vol)

		const scanResult = await scan({
			cwd: "/workspace",
			fs: adapter,
			target: makeGit(),
			dirs: true,
			depth: Infinity,
			invert: 2,
		})

		{
			const match = scanResult.paths.get(".ftpconfig")
			const isIgnored = match ? match.ignored : false
			expect(isIgnored).toBe(true)
		}
		{
			const match = scanResult.paths.get(".git/config")
			const isIgnored = match ? match.ignored : false
			expect(isIgnored).toBe(false)
		}
		{
			const match = scanResult.paths.get(".git/description")
			const isIgnored = match ? match.ignored : false
			expect(isIgnored).toBe(true)
		}
	})

	test("#26: .gitignore man page sample", async () => {
		const patterns = [
			"# exclude everything except directory foo/bar",
			"/*",
			"!/foo",
			"/foo/*",
			"!/foo/bar",
		]
		const gitignoreContent = patterns.join("\n")
		const allPaths = ["no.js", "foo/no.js", "foo/bar/yes.js", "foo/bar/baz/yes.js", "boo/no.js"]
		const tree = buildTree(allPaths)

		tree[".gitignore"] = gitignoreContent

		const vol = Volume.fromNestedJSON(tree, "/workspace")
		const adapter = createAdapter(vol)

		const scanResult = await scan({
			cwd: "/workspace",
			fs: adapter,
			target: makeGit(),
			dirs: true,
			depth: Infinity,
			invert: 2,
		})

		{
			const match = scanResult.paths.get("no.js")
			const isIgnored = match ? match.ignored : false
			expect(isIgnored).toBe(true)
		}
		{
			const match = scanResult.paths.get("foo/no.js")
			const isIgnored = match ? match.ignored : false
			expect(isIgnored).toBe(true)
		}
		{
			const match = scanResult.paths.get("foo/bar/yes.js")
			const isIgnored = match ? match.ignored : false
			expect(isIgnored).toBe(false)
		}
		{
			const match = scanResult.paths.get("foo/bar/baz/yes.js")
			const isIgnored = match ? match.ignored : false
			expect(isIgnored).toBe(false)
		}
		{
			const match = scanResult.paths.get("boo/no.js")
			const isIgnored = match ? match.ignored : false
			expect(isIgnored).toBe(true)
		}
	})

	test("wildcard: special case, escaped wildcard", async () => {
		const patterns = ["*.html", "!a/b/\\*/index.html"]
		const gitignoreContent = patterns.join("\n")
		const allPaths = ["a/b/*/index.html", "a/b/index.html"]
		const tree = buildTree(allPaths)

		tree[".gitignore"] = gitignoreContent

		const vol = Volume.fromNestedJSON(tree, "/workspace")
		const adapter = createAdapter(vol)

		const scanResult = await scan({
			cwd: "/workspace",
			fs: adapter,
			target: makeGit(),
			dirs: true,
			depth: Infinity,
			invert: 2,
		})

		{
			const match = scanResult.paths.get("a/b/*/index.html")
			const isIgnored = match ? match.ignored : false
			expect(isIgnored).toBe(false)
		}
		{
			const match = scanResult.paths.get("a/b/index.html")
			const isIgnored = match ? match.ignored : false
			expect(isIgnored).toBe(true)
		}
	})

	test("wildcard: treated as a shell glob suitable for consumption by fnmatch(3)", async () => {
		const patterns = ["*.html", "!b/\\*/index.html"]
		const gitignoreContent = patterns.join("\n")
		const allPaths = ["a/b/*/index.html", "a/b/index.html"]
		const tree = buildTree(allPaths)

		tree[".gitignore"] = gitignoreContent

		const vol = Volume.fromNestedJSON(tree, "/workspace")
		const adapter = createAdapter(vol)

		const scanResult = await scan({
			cwd: "/workspace",
			fs: adapter,
			target: makeGit(),
			dirs: true,
			depth: Infinity,
			invert: 2,
		})

		{
			const match = scanResult.paths.get("a/b/*/index.html")
			const isIgnored = match ? match.ignored : false
			expect(isIgnored).toBe(true)
		}
		{
			const match = scanResult.paths.get("a/b/index.html")
			const isIgnored = match ? match.ignored : false
			expect(isIgnored).toBe(true)
		}
	})

	test("wildcard: with no escape", async () => {
		const patterns = ["*.html", "!a/b/*/index.html"]
		const gitignoreContent = patterns.join("\n")
		const allPaths = ["a/b/*/index.html", "a/b/index.html"]
		const tree = buildTree(allPaths)

		tree[".gitignore"] = gitignoreContent

		const vol = Volume.fromNestedJSON(tree, "/workspace")
		const adapter = createAdapter(vol)

		const scanResult = await scan({
			cwd: "/workspace",
			fs: adapter,
			target: makeGit(),
			dirs: true,
			depth: Infinity,
			invert: 2,
		})

		{
			const match = scanResult.paths.get("a/b/*/index.html")
			const isIgnored = match ? match.ignored : false
			expect(isIgnored).toBe(false)
		}
		{
			const match = scanResult.paths.get("a/b/index.html")
			const isIgnored = match ? match.ignored : false
			expect(isIgnored).toBe(true)
		}
	})

	test("#24: a negative pattern without a trailing wildcard", async () => {
		const patterns = ["/node_modules/*", "!/node_modules", "!/node_modules/package"]
		const gitignoreContent = patterns.join("\n")
		const allPaths = ["node_modules/a/a.js", "node_modules/package/a.js"]
		const tree = buildTree(allPaths)

		tree[".gitignore"] = gitignoreContent

		const vol = Volume.fromNestedJSON(tree, "/workspace")
		const adapter = createAdapter(vol)

		const scanResult = await scan({
			cwd: "/workspace",
			fs: adapter,
			target: makeGit(),
			dirs: true,
			depth: Infinity,
			invert: 2,
		})

		{
			const match = scanResult.paths.get("node_modules/a/a.js")
			const isIgnored = match ? match.ignored : false
			expect(isIgnored).toBe(true)
		}
		{
			const match = scanResult.paths.get("node_modules/package/a.js")
			const isIgnored = match ? match.ignored : false
			expect(isIgnored).toBe(false)
		}
	})

	test("#21: unignore with 1 globstar, reversed order", async () => {
		const patterns = ["!foo/bar.js", "foo/*"]
		const gitignoreContent = patterns.join("\n")
		const allPaths = ["foo/bar.js", "foo/bar2.js", "foo/bar/bar.js"]
		const tree = buildTree(allPaths)

		tree[".gitignore"] = gitignoreContent

		const vol = Volume.fromNestedJSON(tree, "/workspace")
		const adapter = createAdapter(vol)

		const scanResult = await scan({
			cwd: "/workspace",
			fs: adapter,
			target: makeGit(),
			dirs: true,
			depth: Infinity,
			invert: 2,
		})

		{
			const match = scanResult.paths.get("foo/bar.js")
			const isIgnored = match ? match.ignored : false
			expect(isIgnored).toBe(true)
		}
		{
			const match = scanResult.paths.get("foo/bar2.js")
			const isIgnored = match ? match.ignored : false
			expect(isIgnored).toBe(true)
		}
		{
			const match = scanResult.paths.get("foo/bar/bar.js")
			const isIgnored = match ? match.ignored : false
			expect(isIgnored).toBe(true)
		}
	})

	test("#21: unignore with 2 globstars, reversed order", async () => {
		const patterns = ["!foo/bar.js", "foo/**"]
		const gitignoreContent = patterns.join("\n")
		const allPaths = ["foo/bar.js", "foo/bar2.js", "foo/bar/bar.js"]
		const tree = buildTree(allPaths)

		tree[".gitignore"] = gitignoreContent

		const vol = Volume.fromNestedJSON(tree, "/workspace")
		const adapter = createAdapter(vol)

		const scanResult = await scan({
			cwd: "/workspace",
			fs: adapter,
			target: makeGit(),
			dirs: true,
			depth: Infinity,
			invert: 2,
		})

		{
			const match = scanResult.paths.get("foo/bar.js")
			const isIgnored = match ? match.ignored : false
			expect(isIgnored).toBe(true)
		}
		{
			const match = scanResult.paths.get("foo/bar2.js")
			const isIgnored = match ? match.ignored : false
			expect(isIgnored).toBe(true)
		}
		{
			const match = scanResult.paths.get("foo/bar/bar.js")
			const isIgnored = match ? match.ignored : false
			expect(isIgnored).toBe(true)
		}
	})

	test("#21: unignore with several groups of 2 globstars, reversed order", async () => {
		const patterns = ["!foo/bar.js", "foo/**/**"]
		const gitignoreContent = patterns.join("\n")
		const allPaths = ["foo/bar.js", "foo/bar2.js", "foo/bar/bar.js"]
		const tree = buildTree(allPaths)

		tree[".gitignore"] = gitignoreContent

		const vol = Volume.fromNestedJSON(tree, "/workspace")
		const adapter = createAdapter(vol)

		const scanResult = await scan({
			cwd: "/workspace",
			fs: adapter,
			target: makeGit(),
			dirs: true,
			depth: Infinity,
			invert: 2,
		})

		{
			const match = scanResult.paths.get("foo/bar.js")
			const isIgnored = match ? match.ignored : false
			expect(isIgnored).toBe(true)
		}
		{
			const match = scanResult.paths.get("foo/bar2.js")
			const isIgnored = match ? match.ignored : false
			expect(isIgnored).toBe(true)
		}
		{
			const match = scanResult.paths.get("foo/bar/bar.js")
			const isIgnored = match ? match.ignored : false
			expect(isIgnored).toBe(true)
		}
	})

	test("#21: unignore with 1 globstar", async () => {
		const patterns = ["foo/*", "!foo/bar.js"]
		const gitignoreContent = patterns.join("\n")
		const allPaths = ["foo/bar.js", "foo/bar2.js", "foo/bar/bar.js"]
		const tree = buildTree(allPaths)

		tree[".gitignore"] = gitignoreContent

		const vol = Volume.fromNestedJSON(tree, "/workspace")
		const adapter = createAdapter(vol)

		const scanResult = await scan({
			cwd: "/workspace",
			fs: adapter,
			target: makeGit(),
			dirs: true,
			depth: Infinity,
			invert: 2,
		})

		{
			const match = scanResult.paths.get("foo/bar.js")
			const isIgnored = match ? match.ignored : false
			expect(isIgnored).toBe(false)
		}
		{
			const match = scanResult.paths.get("foo/bar2.js")
			const isIgnored = match ? match.ignored : false
			expect(isIgnored).toBe(true)
		}
		{
			const match = scanResult.paths.get("foo/bar/bar.js")
			const isIgnored = match ? match.ignored : false
			expect(isIgnored).toBe(true)
		}
	})

	test("#21: unignore with 2 globstars", async () => {
		const patterns = ["foo/**", "!foo/bar.js"]
		const gitignoreContent = patterns.join("\n")
		const allPaths = ["foo/bar.js", "foo/bar2.js", "foo/bar/bar.js"]
		const tree = buildTree(allPaths)

		tree[".gitignore"] = gitignoreContent

		const vol = Volume.fromNestedJSON(tree, "/workspace")
		const adapter = createAdapter(vol)

		const scanResult = await scan({
			cwd: "/workspace",
			fs: adapter,
			target: makeGit(),
			dirs: true,
			depth: Infinity,
			invert: 2,
		})

		{
			const match = scanResult.paths.get("foo/bar.js")
			const isIgnored = match ? match.ignored : false
			expect(isIgnored).toBe(false)
		}
		{
			const match = scanResult.paths.get("foo/bar2.js")
			const isIgnored = match ? match.ignored : false
			expect(isIgnored).toBe(true)
		}
		{
			const match = scanResult.paths.get("foo/bar/bar.js")
			const isIgnored = match ? match.ignored : false
			expect(isIgnored).toBe(true)
		}
	})

	test("related to #21: several groups of 2 globstars", async () => {
		const patterns = ["foo/**/**", "!foo/bar.js"]
		const gitignoreContent = patterns.join("\n")
		const allPaths = ["foo/bar.js", "foo/bar2.js", "foo/bar/bar.js"]
		const tree = buildTree(allPaths)

		tree[".gitignore"] = gitignoreContent

		const vol = Volume.fromNestedJSON(tree, "/workspace")
		const adapter = createAdapter(vol)

		const scanResult = await scan({
			cwd: "/workspace",
			fs: adapter,
			target: makeGit(),
			dirs: true,
			depth: Infinity,
			invert: 2,
		})

		{
			const match = scanResult.paths.get("foo/bar.js")
			const isIgnored = match ? match.ignored : false
			expect(isIgnored).toBe(false)
		}
		{
			const match = scanResult.paths.get("foo/bar2.js")
			const isIgnored = match ? match.ignored : false
			expect(isIgnored).toBe(true)
		}
		{
			const match = scanResult.paths.get("foo/bar/bar.js")
			const isIgnored = match ? match.ignored : false
			expect(isIgnored).toBe(true)
		}
	})

	test("ignore dot files", async () => {
		const patterns = [".*"]
		const gitignoreContent = patterns.join("\n")
		const allPaths = [".a", ".gitignore"]
		const tree = buildTree(allPaths)

		tree[".gitignore"] = gitignoreContent

		const vol = Volume.fromNestedJSON(tree, "/workspace")
		const adapter = createAdapter(vol)

		const scanResult = await scan({
			cwd: "/workspace",
			fs: adapter,
			target: makeGit(),
			dirs: true,
			depth: Infinity,
			invert: 2,
		})

		{
			const match = scanResult.paths.get(".a")
			const isIgnored = match ? match.ignored : false
			expect(isIgnored).toBe(true)
		}
		{
			const match = scanResult.paths.get(".gitignore")
			const isIgnored = match ? match.ignored : false
			expect(isIgnored).toBe(true)
		}
	})

	test("#14, README example broken in 3.0.3", async () => {
		const patterns = [".abc/*", "!.abc/d/"]
		const gitignoreContent = patterns.join("\n")
		const allPaths = [".abc/a.js", ".abc/d/e.js"]
		const tree = buildTree(allPaths)

		tree[".gitignore"] = gitignoreContent

		const vol = Volume.fromNestedJSON(tree, "/workspace")
		const adapter = createAdapter(vol)

		const scanResult = await scan({
			cwd: "/workspace",
			fs: adapter,
			target: makeGit(),
			dirs: true,
			depth: Infinity,
			invert: 2,
		})

		{
			const match = scanResult.paths.get(".abc/a.js")
			const isIgnored = match ? match.ignored : false
			expect(isIgnored).toBe(true)
		}
		{
			const match = scanResult.paths.get(".abc/d/e.js")
			const isIgnored = match ? match.ignored : false
			expect(isIgnored).toBe(false)
		}
	})

	test("#14, README example broken in 3.0.3, not negate parent folder", async () => {
		const patterns = [".abc/*", "!.abc/d/*"]
		const gitignoreContent = patterns.join("\n")
		const allPaths = [".abc/a.js", ".abc/d/e.js"]
		const tree = buildTree(allPaths)

		tree[".gitignore"] = gitignoreContent

		const vol = Volume.fromNestedJSON(tree, "/workspace")
		const adapter = createAdapter(vol)

		const scanResult = await scan({
			cwd: "/workspace",
			fs: adapter,
			target: makeGit(),
			dirs: true,
			depth: Infinity,
			invert: 2,
		})

		{
			const match = scanResult.paths.get(".abc/a.js")
			const isIgnored = match ? match.ignored : false
			expect(isIgnored).toBe(true)
		}
		{
			const match = scanResult.paths.get(".abc/d/e.js")
			const isIgnored = match ? match.ignored : false
			expect(isIgnored).toBe(true)
		}
	})

	test("A blank line matches no files", async () => {
		const patterns = [""]
		const gitignoreContent = patterns.join("\n")
		const allPaths = ["a", "a/b/c"]
		const tree = buildTree(allPaths)

		tree[".gitignore"] = gitignoreContent

		const vol = Volume.fromNestedJSON(tree, "/workspace")
		const adapter = createAdapter(vol)

		const scanResult = await scan({
			cwd: "/workspace",
			fs: adapter,
			target: makeGit(),
			dirs: true,
			depth: Infinity,
			invert: 2,
		})

		{
			const match = scanResult.paths.get("a")
			const isIgnored = match ? match.ignored : false
			expect(isIgnored).toBe(false)
		}
		{
			const match = scanResult.paths.get("a/b/c")
			const isIgnored = match ? match.ignored : false
			expect(isIgnored).toBe(false)
		}
	})

	test("A line starting with # serves as a comment.", async () => {
		const patterns = ["#abc"]
		const gitignoreContent = patterns.join("\n")
		const allPaths = ["#abc"]
		const tree = buildTree(allPaths)

		tree[".gitignore"] = gitignoreContent

		const vol = Volume.fromNestedJSON(tree, "/workspace")
		const adapter = createAdapter(vol)

		const scanResult = await scan({
			cwd: "/workspace",
			fs: adapter,
			target: makeGit(),
			dirs: true,
			depth: Infinity,
			invert: 2,
		})

		{
			const match = scanResult.paths.get("#abc")
			const isIgnored = match ? match.ignored : false
			expect(isIgnored).toBe(false)
		}
	})

	test('Put a backslash ("\\") in front of the first hash for patterns that begin with a hash.', async () => {
		const patterns = ["\\#abc"]
		const gitignoreContent = patterns.join("\n")
		const allPaths = ["#abc"]
		const tree = buildTree(allPaths)

		tree[".gitignore"] = gitignoreContent

		const vol = Volume.fromNestedJSON(tree, "/workspace")
		const adapter = createAdapter(vol)

		const scanResult = await scan({
			cwd: "/workspace",
			fs: adapter,
			target: makeGit(),
			dirs: true,
			depth: Infinity,
			invert: 2,
		})

		{
			const match = scanResult.paths.get("#abc")
			const isIgnored = match ? match.ignored : false
			expect(isIgnored).toBe(true)
		}
	})

	test('An optional prefix "!" which negates the pattern; any matching file excluded by a previous pattern will become included again', async () => {
		const patterns = ["abc", "!abc"]
		const gitignoreContent = patterns.join("\n")
		const allPaths = ["abc/a.js", "abc/"]
		const tree = buildTree(allPaths)

		tree[".gitignore"] = gitignoreContent

		const vol = Volume.fromNestedJSON(tree, "/workspace")
		const adapter = createAdapter(vol)

		const scanResult = await scan({
			cwd: "/workspace",
			fs: adapter,
			target: makeGit(),
			dirs: true,
			depth: Infinity,
			invert: 2,
		})

		{
			const match = scanResult.paths.get("abc/a.js")
			const isIgnored = match ? match.ignored : false
			expect(isIgnored).toBe(false)
		}
		{
			const match = scanResult.paths.get("abc/")
			const isIgnored = match ? match.ignored : false
			expect(isIgnored).toBe(false)
		}
	})

	test("issue #10: It is not possible to re-include a file if a parent directory of that file is excluded", async () => {
		const patterns = ["/abc/", "!/abc/a.js"]
		const gitignoreContent = patterns.join("\n")
		const allPaths = ["abc/a.js", "abc/d/e.js"]
		const tree = buildTree(allPaths)

		tree[".gitignore"] = gitignoreContent

		const vol = Volume.fromNestedJSON(tree, "/workspace")
		const adapter = createAdapter(vol)

		const scanResult = await scan({
			cwd: "/workspace",
			fs: adapter,
			target: makeGit(),
			dirs: true,
			depth: Infinity,
			invert: 2,
		})

		{
			const match = scanResult.paths.get("abc/a.js")
			const isIgnored = match ? match.ignored : false
			expect(isIgnored).toBe(true)
		}
		{
			const match = scanResult.paths.get("abc/d/e.js")
			const isIgnored = match ? match.ignored : false
			expect(isIgnored).toBe(true)
		}
	})

	test("we did not know whether the rule is a dir first", async () => {
		const patterns = ["abc", "!bcd/abc/a.js"]
		const gitignoreContent = patterns.join("\n")
		const allPaths = ["abc/a.js", "bcd/abc/a.js"]
		const tree = buildTree(allPaths)

		tree[".gitignore"] = gitignoreContent

		const vol = Volume.fromNestedJSON(tree, "/workspace")
		const adapter = createAdapter(vol)

		const scanResult = await scan({
			cwd: "/workspace",
			fs: adapter,
			target: makeGit(),
			dirs: true,
			depth: Infinity,
			invert: 2,
		})

		{
			const match = scanResult.paths.get("abc/a.js")
			const isIgnored = match ? match.ignored : false
			expect(isIgnored).toBe(true)
		}
		{
			const match = scanResult.paths.get("bcd/abc/a.js")
			const isIgnored = match ? match.ignored : false
			expect(isIgnored).toBe(true)
		}
	})

	test('Put a backslash ("\\") in front of the first "!" for patterns that begin with a literal "!"', async () => {
		const patterns = ["\\!abc", "\\!important!.txt"]
		const gitignoreContent = patterns.join("\n")
		const allPaths = ["!abc", "abc", "b/!important!.txt", "!important!.txt"]
		const tree = buildTree(allPaths)

		tree[".gitignore"] = gitignoreContent

		const vol = Volume.fromNestedJSON(tree, "/workspace")
		const adapter = createAdapter(vol)

		const scanResult = await scan({
			cwd: "/workspace",
			fs: adapter,
			target: makeGit(),
			dirs: true,
			depth: Infinity,
			invert: 2,
		})

		{
			const match = scanResult.paths.get("!abc")
			const isIgnored = match ? match.ignored : false
			expect(isIgnored).toBe(true)
		}
		{
			const match = scanResult.paths.get("abc")
			const isIgnored = match ? match.ignored : false
			expect(isIgnored).toBe(false)
		}
		{
			const match = scanResult.paths.get("b/!important!.txt")
			const isIgnored = match ? match.ignored : false
			expect(isIgnored).toBe(true)
		}
		{
			const match = scanResult.paths.get("!important!.txt")
			const isIgnored = match ? match.ignored : false
			expect(isIgnored).toBe(true)
		}
	})

	test("If the pattern ends with a slash, it is removed for the purpose of the following description, but it would only find a match with a directory", async () => {
		const patterns = ["abc/"]
		const gitignoreContent = patterns.join("\n")
		const allPaths = ["abc", "abc/", "bcd/abc/"]
		const tree = buildTree(allPaths)

		tree[".gitignore"] = gitignoreContent

		const vol = Volume.fromNestedJSON(tree, "/workspace")
		const adapter = createAdapter(vol)

		const scanResult = await scan({
			cwd: "/workspace",
			fs: adapter,
			target: makeGit(),
			dirs: true,
			depth: Infinity,
			invert: 2,
		})

		{
			const match = scanResult.paths.get("abc")
			const isIgnored = match ? match.ignored : false
			expect(isIgnored).toBe(false)
		}
		{
			const match = scanResult.paths.get("abc/")
			const isIgnored = match ? match.ignored : false
			expect(isIgnored).toBe(true)
		}
		{
			const match = scanResult.paths.get("bcd/abc/")
			const isIgnored = match ? match.ignored : false
			expect(isIgnored).toBe(true)
		}
	})

	test("If the pattern does not contain a slash /, Git treats it as a shell glob pattern", async () => {
		const patterns = ["a.js", "f/"]
		const gitignoreContent = patterns.join("\n")
		const allPaths = ["a.js", "b/a/a.js", "a/a.js", "b/a.jsa", "f/", "g/f/"]
		const tree = buildTree(allPaths)

		tree[".gitignore"] = gitignoreContent

		const vol = Volume.fromNestedJSON(tree, "/workspace")
		const adapter = createAdapter(vol)

		const scanResult = await scan({
			cwd: "/workspace",
			fs: adapter,
			target: makeGit(),
			dirs: true,
			depth: Infinity,
			invert: 2,
		})

		{
			const match = scanResult.paths.get("a.js")
			const isIgnored = match ? match.ignored : false
			expect(isIgnored).toBe(true)
		}
		{
			const match = scanResult.paths.get("b/a/a.js")
			const isIgnored = match ? match.ignored : false
			expect(isIgnored).toBe(true)
		}
		{
			const match = scanResult.paths.get("a/a.js")
			const isIgnored = match ? match.ignored : false
			expect(isIgnored).toBe(true)
		}
		{
			const match = scanResult.paths.get("b/a.jsa")
			const isIgnored = match ? match.ignored : false
			expect(isIgnored).toBe(false)
		}
		{
			const match = scanResult.paths.get("f/")
			const isIgnored = match ? match.ignored : false
			expect(isIgnored).toBe(true)
		}
		{
			const match = scanResult.paths.get("g/f/")
			const isIgnored = match ? match.ignored : false
			expect(isIgnored).toBe(true)
		}
	})

	test("Otherwise, Git treats the pattern as a shell glob suitable for consumption by fnmatch(3) with the FNM_PATHNAME flag", async () => {
		const patterns = ["a/a.js"]
		const gitignoreContent = patterns.join("\n")
		const allPaths = ["a/a.js", "a/a.jsa", "b/a/a.js", "c/a/a.js"]
		const tree = buildTree(allPaths)

		tree[".gitignore"] = gitignoreContent

		const vol = Volume.fromNestedJSON(tree, "/workspace")
		const adapter = createAdapter(vol)

		const scanResult = await scan({
			cwd: "/workspace",
			fs: adapter,
			target: makeGit(),
			dirs: true,
			depth: Infinity,
			invert: 2,
		})

		{
			const match = scanResult.paths.get("a/a.js")
			const isIgnored = match ? match.ignored : false
			expect(isIgnored).toBe(true)
		}
		{
			const match = scanResult.paths.get("a/a.jsa")
			const isIgnored = match ? match.ignored : false
			expect(isIgnored).toBe(false)
		}
		{
			const match = scanResult.paths.get("b/a/a.js")
			const isIgnored = match ? match.ignored : false
			expect(isIgnored).toBe(false)
		}
		{
			const match = scanResult.paths.get("c/a/a.js")
			const isIgnored = match ? match.ignored : false
			expect(isIgnored).toBe(false)
		}
	})

	test("wildcards in the pattern will not match a / in the pathname.", async () => {
		const patterns = ["Documentation/*.html"]
		const gitignoreContent = patterns.join("\n")
		const allPaths = [
			"Documentation/git.html",
			"Documentation/ppc/ppc.html",
			"tools/perf/Documentation/perf.html",
		]
		const tree = buildTree(allPaths)

		tree[".gitignore"] = gitignoreContent

		const vol = Volume.fromNestedJSON(tree, "/workspace")
		const adapter = createAdapter(vol)

		const scanResult = await scan({
			cwd: "/workspace",
			fs: adapter,
			target: makeGit(),
			dirs: true,
			depth: Infinity,
			invert: 2,
		})

		{
			const match = scanResult.paths.get("Documentation/git.html")
			const isIgnored = match ? match.ignored : false
			expect(isIgnored).toBe(true)
		}
		{
			const match = scanResult.paths.get("Documentation/ppc/ppc.html")
			const isIgnored = match ? match.ignored : false
			expect(isIgnored).toBe(false)
		}
		{
			const match = scanResult.paths.get("tools/perf/Documentation/perf.html")
			const isIgnored = match ? match.ignored : false
			expect(isIgnored).toBe(false)
		}
	})

	test("A leading slash matches the beginning of the pathname", async () => {
		const patterns = ["/*.c"]
		const gitignoreContent = patterns.join("\n")
		const allPaths = ["cat-file.c", "mozilla-sha1/sha1.c"]
		const tree = buildTree(allPaths)

		tree[".gitignore"] = gitignoreContent

		const vol = Volume.fromNestedJSON(tree, "/workspace")
		const adapter = createAdapter(vol)

		const scanResult = await scan({
			cwd: "/workspace",
			fs: adapter,
			target: makeGit(),
			dirs: true,
			depth: Infinity,
			invert: 2,
		})

		{
			const match = scanResult.paths.get("cat-file.c")
			const isIgnored = match ? match.ignored : false
			expect(isIgnored).toBe(true)
		}
		{
			const match = scanResult.paths.get("mozilla-sha1/sha1.c")
			const isIgnored = match ? match.ignored : false
			expect(isIgnored).toBe(false)
		}
	})

	test('A leading "**" followed by a slash means match in all directories', async () => {
		const patterns = ["**/foo"]
		const gitignoreContent = patterns.join("\n")
		const allPaths = ["foo", "a/foo", "foo/a", "a/foo/a", "a/b/c/foo/a"]
		const tree = buildTree(allPaths)

		tree[".gitignore"] = gitignoreContent

		const vol = Volume.fromNestedJSON(tree, "/workspace")
		const adapter = createAdapter(vol)

		const scanResult = await scan({
			cwd: "/workspace",
			fs: adapter,
			target: makeGit(),
			dirs: true,
			depth: Infinity,
			invert: 2,
		})

		{
			const match = scanResult.paths.get("foo")
			const isIgnored = match ? match.ignored : false
			expect(isIgnored).toBe(true)
		}
		{
			const match = scanResult.paths.get("a/foo")
			const isIgnored = match ? match.ignored : false
			expect(isIgnored).toBe(true)
		}
		{
			const match = scanResult.paths.get("foo/a")
			const isIgnored = match ? match.ignored : false
			expect(isIgnored).toBe(true)
		}
		{
			const match = scanResult.paths.get("a/foo/a")
			const isIgnored = match ? match.ignored : false
			expect(isIgnored).toBe(true)
		}
		{
			const match = scanResult.paths.get("a/b/c/foo/a")
			const isIgnored = match ? match.ignored : false
			expect(isIgnored).toBe(true)
		}
	})

	test('consecutive leading "**/" behave as a single "**/"', async () => {
		const patterns = ["**/**/foo"]
		const gitignoreContent = patterns.join("\n")
		const allPaths = ["foo", "a/foo", "a/b/foo"]
		const tree = buildTree(allPaths)

		tree[".gitignore"] = gitignoreContent

		const vol = Volume.fromNestedJSON(tree, "/workspace")
		const adapter = createAdapter(vol)

		const scanResult = await scan({
			cwd: "/workspace",
			fs: adapter,
			target: makeGit(),
			dirs: true,
			depth: Infinity,
			invert: 2,
		})

		{
			const match = scanResult.paths.get("foo")
			const isIgnored = match ? match.ignored : false
			expect(isIgnored).toBe(true)
		}
		{
			const match = scanResult.paths.get("a/foo")
			const isIgnored = match ? match.ignored : false
			expect(isIgnored).toBe(true)
		}
		{
			const match = scanResult.paths.get("a/b/foo")
			const isIgnored = match ? match.ignored : false
			expect(isIgnored).toBe(true)
		}
	})

	test('"**/foo/bar" matches file or directory "bar" anywhere that is directly under directory "foo"', async () => {
		const patterns = ["**/foo/bar"]
		const gitignoreContent = patterns.join("\n")
		const allPaths = ["foo/bar", "abc/foo/bar", "abc/foo/bar/"]
		const tree = buildTree(allPaths)

		tree[".gitignore"] = gitignoreContent

		const vol = Volume.fromNestedJSON(tree, "/workspace")
		const adapter = createAdapter(vol)

		const scanResult = await scan({
			cwd: "/workspace",
			fs: adapter,
			target: makeGit(),
			dirs: true,
			depth: Infinity,
			invert: 2,
		})

		{
			const match = scanResult.paths.get("foo/bar")
			const isIgnored = match ? match.ignored : false
			expect(isIgnored).toBe(true)
		}
		{
			const match = scanResult.paths.get("abc/foo/bar")
			const isIgnored = match ? match.ignored : false
			expect(isIgnored).toBe(true)
		}
		{
			const match = scanResult.paths.get("abc/foo/bar/")
			const isIgnored = match ? match.ignored : false
			expect(isIgnored).toBe(true)
		}
	})

	test('A trailing "/**" matches everything inside', async () => {
		const patterns = ["abc/**"]
		const gitignoreContent = patterns.join("\n")
		const allPaths = ["abc/a/", "abc/b", "abc/d/e/f/g", "bcd/abc/a", "abc"]
		const tree = buildTree(allPaths)

		tree[".gitignore"] = gitignoreContent

		const vol = Volume.fromNestedJSON(tree, "/workspace")
		const adapter = createAdapter(vol)

		const scanResult = await scan({
			cwd: "/workspace",
			fs: adapter,
			target: makeGit(),
			dirs: true,
			depth: Infinity,
			invert: 2,
		})

		{
			const match = scanResult.paths.get("abc/a/")
			const isIgnored = match ? match.ignored : false
			expect(isIgnored).toBe(true)
		}
		{
			const match = scanResult.paths.get("abc/b")
			const isIgnored = match ? match.ignored : false
			expect(isIgnored).toBe(true)
		}
		{
			const match = scanResult.paths.get("abc/d/e/f/g")
			const isIgnored = match ? match.ignored : false
			expect(isIgnored).toBe(true)
		}
		{
			const match = scanResult.paths.get("bcd/abc/a")
			const isIgnored = match ? match.ignored : false
			expect(isIgnored).toBe(false)
		}
		{
			const match = scanResult.paths.get("abc")
			const isIgnored = match ? match.ignored : false
			expect(isIgnored).toBe(false)
		}
	})

	test("A slash followed by two consecutive asterisks then a slash matches zero or more directories", async () => {
		const patterns = ["a/**/b"]
		const gitignoreContent = patterns.join("\n")
		const allPaths = ["a/b", "a/x/b", "a/x/y/b", "b/a/b"]
		const tree = buildTree(allPaths)

		tree[".gitignore"] = gitignoreContent

		const vol = Volume.fromNestedJSON(tree, "/workspace")
		const adapter = createAdapter(vol)

		const scanResult = await scan({
			cwd: "/workspace",
			fs: adapter,
			target: makeGit(),
			dirs: true,
			depth: Infinity,
			invert: 2,
		})

		{
			const match = scanResult.paths.get("a/b")
			const isIgnored = match ? match.ignored : false
			expect(isIgnored).toBe(true)
		}
		{
			const match = scanResult.paths.get("a/x/b")
			const isIgnored = match ? match.ignored : false
			expect(isIgnored).toBe(true)
		}
		{
			const match = scanResult.paths.get("a/x/y/b")
			const isIgnored = match ? match.ignored : false
			expect(isIgnored).toBe(true)
		}
		{
			const match = scanResult.paths.get("b/a/b")
			const isIgnored = match ? match.ignored : false
			expect(isIgnored).toBe(false)
		}
	})

	test("add a file content", async () => {
		const patterns = AIGNORE_CONTENT.split("\n")
		const gitignoreContent = patterns.join("\n")
		const allPaths = ["abc/a.js", "abc/b/b.js", "#e", "#f"]
		const tree = buildTree(allPaths)

		tree[".gitignore"] = gitignoreContent

		const vol = Volume.fromNestedJSON(tree, "/workspace")
		const adapter = createAdapter(vol)

		const scanResult = await scan({
			cwd: "/workspace",
			fs: adapter,
			target: makeGit(),
			dirs: true,
			depth: Infinity,
			invert: 2,
		})

		{
			const match = scanResult.paths.get("abc/a.js")
			const isIgnored = match ? match.ignored : false
			expect(isIgnored).toBe(true)
		}
		{
			const match = scanResult.paths.get("abc/b/b.js")
			const isIgnored = match ? match.ignored : false
			expect(isIgnored).toBe(true)
		}
		{
			const match = scanResult.paths.get("#e")
			const isIgnored = match ? match.ignored : false
			expect(isIgnored).toBe(false)
		}
		{
			const match = scanResult.paths.get("#f")
			const isIgnored = match ? match.ignored : false
			expect(isIgnored).toBe(true)
		}
	})

	test("should excape metacharacters of regular expressions", async () => {
		const patterns = ["*.js", "!\\*.js", "!a#b.js", "!?.js", "#abc", "\\#abc"]
		const gitignoreContent = patterns.join("\n")
		const allPaths = ["*.js", "abc.js", "a#b.js", "abc", "#abc", "?.js"]
		const tree = buildTree(allPaths)

		tree[".gitignore"] = gitignoreContent

		const vol = Volume.fromNestedJSON(tree, "/workspace")
		const adapter = createAdapter(vol)

		const scanResult = await scan({
			cwd: "/workspace",
			fs: adapter,
			target: makeGit(),
			dirs: true,
			depth: Infinity,
			invert: 2,
		})

		{
			const match = scanResult.paths.get("*.js")
			const isIgnored = match ? match.ignored : false
			expect(isIgnored).toBe(false)
		}
		{
			const match = scanResult.paths.get("abc.js")
			const isIgnored = match ? match.ignored : false
			expect(isIgnored).toBe(true)
		}
		{
			const match = scanResult.paths.get("a#b.js")
			const isIgnored = match ? match.ignored : false
			expect(isIgnored).toBe(false)
		}
		{
			const match = scanResult.paths.get("abc")
			const isIgnored = match ? match.ignored : false
			expect(isIgnored).toBe(false)
		}
		{
			const match = scanResult.paths.get("#abc")
			const isIgnored = match ? match.ignored : false
			expect(isIgnored).toBe(true)
		}
		{
			const match = scanResult.paths.get("?.js")
			const isIgnored = match ? match.ignored : false
			expect(isIgnored).toBe(false)
		}
	})

	test("issue #2: question mark should not break all things", async () => {
		const patterns = IGNORE_ISSUE_2_CONTENT.split("\n")
		const gitignoreContent = patterns.join("\n")
		const allPaths = [".project", "abc/.project", ".a.sw", ".a.sw?", "thumbs.db"]
		const tree = buildTree(allPaths)

		tree[".gitignore"] = gitignoreContent

		const vol = Volume.fromNestedJSON(tree, "/workspace")
		const adapter = createAdapter(vol)

		const scanResult = await scan({
			cwd: "/workspace",
			fs: adapter,
			target: makeGit(),
			dirs: true,
			depth: Infinity,
			invert: 2,
		})

		{
			const match = scanResult.paths.get(".project")
			const isIgnored = match ? match.ignored : false
			expect(isIgnored).toBe(true)
		}
		{
			const match = scanResult.paths.get("abc/.project")
			const isIgnored = match ? match.ignored : false
			expect(isIgnored).toBe(false)
		}
		{
			const match = scanResult.paths.get(".a.sw")
			const isIgnored = match ? match.ignored : false
			expect(isIgnored).toBe(false)
		}
		{
			const match = scanResult.paths.get(".a.sw?")
			const isIgnored = match ? match.ignored : false
			expect(isIgnored).toBe(true)
		}
		{
			const match = scanResult.paths.get("thumbs.db")
			const isIgnored = match ? match.ignored : false
			expect(isIgnored).toBe(true)
		}
	})

	test('dir ended with "*"', async () => {
		const patterns = ["abc/*"]
		const gitignoreContent = patterns.join("\n")
		const allPaths = ["abc"]
		const tree = buildTree(allPaths)

		tree[".gitignore"] = gitignoreContent

		const vol = Volume.fromNestedJSON(tree, "/workspace")
		const adapter = createAdapter(vol)

		const scanResult = await scan({
			cwd: "/workspace",
			fs: adapter,
			target: makeGit(),
			dirs: true,
			depth: Infinity,
			invert: 2,
		})

		{
			const match = scanResult.paths.get("abc")
			const isIgnored = match ? match.ignored : false
			expect(isIgnored).toBe(false)
		}
	})

	test('file ended with "*"', async () => {
		const patterns = ["abc.js*"]
		const gitignoreContent = patterns.join("\n")
		const allPaths = ["abc.js/", "abc.js/abc", "abc.jsa/", "abc.jsa/abc"]
		const tree = buildTree(allPaths)

		tree[".gitignore"] = gitignoreContent

		const vol = Volume.fromNestedJSON(tree, "/workspace")
		const adapter = createAdapter(vol)

		const scanResult = await scan({
			cwd: "/workspace",
			fs: adapter,
			target: makeGit(),
			dirs: true,
			depth: Infinity,
			invert: 2,
		})

		{
			const match = scanResult.paths.get("abc.js/")
			const isIgnored = match ? match.ignored : false
			expect(isIgnored).toBe(true)
		}
		{
			const match = scanResult.paths.get("abc.js/abc")
			const isIgnored = match ? match.ignored : false
			expect(isIgnored).toBe(true)
		}
		{
			const match = scanResult.paths.get("abc.jsa/")
			const isIgnored = match ? match.ignored : false
			expect(isIgnored).toBe(true)
		}
		{
			const match = scanResult.paths.get("abc.jsa/abc")
			const isIgnored = match ? match.ignored : false
			expect(isIgnored).toBe(true)
		}
	})

	test("wildcard as filename", async () => {
		const patterns = ["*.b"]
		const gitignoreContent = patterns.join("\n")
		const allPaths = ["b/a.b", "b/.b", "b/.ba", "b/c/a.b"]
		const tree = buildTree(allPaths)

		tree[".gitignore"] = gitignoreContent

		const vol = Volume.fromNestedJSON(tree, "/workspace")
		const adapter = createAdapter(vol)

		const scanResult = await scan({
			cwd: "/workspace",
			fs: adapter,
			target: makeGit(),
			dirs: true,
			depth: Infinity,
			invert: 2,
		})

		{
			const match = scanResult.paths.get("b/a.b")
			const isIgnored = match ? match.ignored : false
			expect(isIgnored).toBe(true)
		}
		{
			const match = scanResult.paths.get("b/.b")
			const isIgnored = match ? match.ignored : false
			expect(isIgnored).toBe(true)
		}
		{
			const match = scanResult.paths.get("b/.ba")
			const isIgnored = match ? match.ignored : false
			expect(isIgnored).toBe(false)
		}
		{
			const match = scanResult.paths.get("b/c/a.b")
			const isIgnored = match ? match.ignored : false
			expect(isIgnored).toBe(true)
		}
	})

	test("slash at the beginning and come with a wildcard", async () => {
		const patterns = ["/*.c"]
		const gitignoreContent = patterns.join("\n")
		const allPaths = [".c", "c.c", "c/c.c", "c/d"]
		const tree = buildTree(allPaths)

		tree[".gitignore"] = gitignoreContent

		const vol = Volume.fromNestedJSON(tree, "/workspace")
		const adapter = createAdapter(vol)

		const scanResult = await scan({
			cwd: "/workspace",
			fs: adapter,
			target: makeGit(),
			dirs: true,
			depth: Infinity,
			invert: 2,
		})

		{
			const match = scanResult.paths.get(".c")
			const isIgnored = match ? match.ignored : false
			expect(isIgnored).toBe(true)
		}
		{
			const match = scanResult.paths.get("c.c")
			const isIgnored = match ? match.ignored : false
			expect(isIgnored).toBe(true)
		}
		{
			const match = scanResult.paths.get("c/c.c")
			const isIgnored = match ? match.ignored : false
			expect(isIgnored).toBe(false)
		}
		{
			const match = scanResult.paths.get("c/d")
			const isIgnored = match ? match.ignored : false
			expect(isIgnored).toBe(false)
		}
	})

	test("dot file", async () => {
		const patterns = [".d"]
		const gitignoreContent = patterns.join("\n")
		const allPaths = [".d", ".dd", "d.d", "d/.d", "d/d.d", "d/e"]
		const tree = buildTree(allPaths)

		tree[".gitignore"] = gitignoreContent

		const vol = Volume.fromNestedJSON(tree, "/workspace")
		const adapter = createAdapter(vol)

		const scanResult = await scan({
			cwd: "/workspace",
			fs: adapter,
			target: makeGit(),
			dirs: true,
			depth: Infinity,
			invert: 2,
		})

		{
			const match = scanResult.paths.get(".d")
			const isIgnored = match ? match.ignored : false
			expect(isIgnored).toBe(true)
		}
		{
			const match = scanResult.paths.get(".dd")
			const isIgnored = match ? match.ignored : false
			expect(isIgnored).toBe(false)
		}
		{
			const match = scanResult.paths.get("d.d")
			const isIgnored = match ? match.ignored : false
			expect(isIgnored).toBe(false)
		}
		{
			const match = scanResult.paths.get("d/.d")
			const isIgnored = match ? match.ignored : false
			expect(isIgnored).toBe(true)
		}
		{
			const match = scanResult.paths.get("d/d.d")
			const isIgnored = match ? match.ignored : false
			expect(isIgnored).toBe(false)
		}
		{
			const match = scanResult.paths.get("d/e")
			const isIgnored = match ? match.ignored : false
			expect(isIgnored).toBe(false)
		}
	})

	test("dot dir", async () => {
		const patterns = [".e"]
		const gitignoreContent = patterns.join("\n")
		const allPaths = [".e/", ".ee/", "e.e/", ".e/e", "e/.e", "e/e.e", "e/f"]
		const tree = buildTree(allPaths)

		tree[".gitignore"] = gitignoreContent

		const vol = Volume.fromNestedJSON(tree, "/workspace")
		const adapter = createAdapter(vol)

		const scanResult = await scan({
			cwd: "/workspace",
			fs: adapter,
			target: makeGit(),
			dirs: true,
			depth: Infinity,
			invert: 2,
		})

		{
			const match = scanResult.paths.get(".e/")
			const isIgnored = match ? match.ignored : false
			expect(isIgnored).toBe(true)
		}
		{
			const match = scanResult.paths.get(".ee/")
			const isIgnored = match ? match.ignored : false
			expect(isIgnored).toBe(false)
		}
		{
			const match = scanResult.paths.get("e.e/")
			const isIgnored = match ? match.ignored : false
			expect(isIgnored).toBe(false)
		}
		{
			const match = scanResult.paths.get(".e/e")
			const isIgnored = match ? match.ignored : false
			expect(isIgnored).toBe(true)
		}
		{
			const match = scanResult.paths.get("e/.e")
			const isIgnored = match ? match.ignored : false
			expect(isIgnored).toBe(true)
		}
		{
			const match = scanResult.paths.get("e/e.e")
			const isIgnored = match ? match.ignored : false
			expect(isIgnored).toBe(false)
		}
		{
			const match = scanResult.paths.get("e/f")
			const isIgnored = match ? match.ignored : false
			expect(isIgnored).toBe(false)
		}
	})

	test("node modules: once", async () => {
		const patterns = ["node_modules/"]
		const gitignoreContent = patterns.join("\n")
		const allPaths = [
			"node_modules/gulp/node_modules/abc.md",
			"node_modules/gulp/node_modules/abc.json",
		]
		const tree = buildTree(allPaths)

		tree[".gitignore"] = gitignoreContent

		const vol = Volume.fromNestedJSON(tree, "/workspace")
		const adapter = createAdapter(vol)

		const scanResult = await scan({
			cwd: "/workspace",
			fs: adapter,
			target: makeGit(),
			dirs: true,
			depth: Infinity,
			invert: 2,
		})

		{
			const match = scanResult.paths.get("node_modules/gulp/node_modules/abc.md")
			const isIgnored = match ? match.ignored : false
			expect(isIgnored).toBe(true)
		}
		{
			const match = scanResult.paths.get("node_modules/gulp/node_modules/abc.json")
			const isIgnored = match ? match.ignored : false
			expect(isIgnored).toBe(true)
		}
	})

	test("node modules: sub directories", async () => {
		const patterns = ["node_modules"]
		const gitignoreContent = patterns.join("\n")
		const allPaths = ["a/b/node_modules/abc.md"]
		const tree = buildTree(allPaths)

		tree[".gitignore"] = gitignoreContent

		const vol = Volume.fromNestedJSON(tree, "/workspace")
		const adapter = createAdapter(vol)

		const scanResult = await scan({
			cwd: "/workspace",
			fs: adapter,
			target: makeGit(),
			dirs: true,
			depth: Infinity,
			invert: 2,
		})

		{
			const match = scanResult.paths.get("a/b/node_modules/abc.md")
			const isIgnored = match ? match.ignored : false
			expect(isIgnored).toBe(true)
		}
	})

	test("node modules: twice", async () => {
		const patterns = ["node_modules/", "node_modules/"]
		const gitignoreContent = patterns.join("\n")
		const allPaths = [
			"node_modules/gulp/node_modules/abc.md",
			"node_modules/gulp/node_modules/abc.json",
		]
		const tree = buildTree(allPaths)

		tree[".gitignore"] = gitignoreContent

		const vol = Volume.fromNestedJSON(tree, "/workspace")
		const adapter = createAdapter(vol)

		const scanResult = await scan({
			cwd: "/workspace",
			fs: adapter,
			target: makeGit(),
			dirs: true,
			depth: Infinity,
			invert: 2,
		})

		{
			const match = scanResult.paths.get("node_modules/gulp/node_modules/abc.md")
			const isIgnored = match ? match.ignored : false
			expect(isIgnored).toBe(true)
		}
		{
			const match = scanResult.paths.get("node_modules/gulp/node_modules/abc.json")
			const isIgnored = match ? match.ignored : false
			expect(isIgnored).toBe(true)
		}
	})

	test("unicode characters in windows paths", async () => {
		const patterns = ["test"]
		const gitignoreContent = patterns.join("\n")
		const allPaths = ["some/path/to/test/ignored.js", "some/special/path/to/目录/test/ignored.js"]
		const tree = buildTree(allPaths)

		tree[".gitignore"] = gitignoreContent

		const vol = Volume.fromNestedJSON(tree, "/workspace")
		const adapter = createAdapter(vol)

		const scanResult = await scan({
			cwd: "/workspace",
			fs: adapter,
			target: makeGit(),
			dirs: true,
			depth: Infinity,
			invert: 2,
		})

		{
			const match = scanResult.paths.get("some/path/to/test/ignored.js")
			const isIgnored = match ? match.ignored : false
			expect(isIgnored).toBe(true)
		}
		{
			const match = scanResult.paths.get("some/special/path/to/目录/test/ignored.js")
			const isIgnored = match ? match.ignored : false
			expect(isIgnored).toBe(true)
		}
	})

	test("#68: ignore test for files named ...", async () => {
		const patterns = ["/...", "/....."]
		const gitignoreContent = patterns.join("\n")
		const allPaths = ["...", "....", ".....", "......"]
		const tree = buildTree(allPaths)

		tree[".gitignore"] = gitignoreContent

		const vol = Volume.fromNestedJSON(tree, "/workspace")
		const adapter = createAdapter(vol)

		const scanResult = await scan({
			cwd: "/workspace",
			fs: adapter,
			target: makeGit(),
			dirs: true,
			depth: Infinity,
			invert: 2,
		})

		{
			const match = scanResult.paths.get("...")
			const isIgnored = match ? match.ignored : false
			expect(isIgnored).toBe(true)
		}
		{
			const match = scanResult.paths.get("....")
			const isIgnored = match ? match.ignored : false
			expect(isIgnored).toBe(false)
		}
		{
			const match = scanResult.paths.get(".....")
			const isIgnored = match ? match.ignored : false
			expect(isIgnored).toBe(true)
		}
		{
			const match = scanResult.paths.get("......")
			const isIgnored = match ? match.ignored : false
			expect(isIgnored).toBe(false)
		}
	})

	test("#68: file named ...", async () => {
		const patterns: string[] = []
		const gitignoreContent = patterns.join("\n")
		const allPaths = ["...", "....", "....."]
		const tree = buildTree(allPaths)

		tree[".gitignore"] = gitignoreContent

		const vol = Volume.fromNestedJSON(tree, "/workspace")
		const adapter = createAdapter(vol)

		const scanResult = await scan({
			cwd: "/workspace",
			fs: adapter,
			target: makeGit(),
			dirs: true,
			depth: Infinity,
			invert: 2,
		})

		{
			const match = scanResult.paths.get("...")
			const isIgnored = match ? match.ignored : false
			expect(isIgnored).toBe(false)
		}
		{
			const match = scanResult.paths.get("....")
			const isIgnored = match ? match.ignored : false
			expect(isIgnored).toBe(false)
		}
		{
			const match = scanResult.paths.get(".....")
			const isIgnored = match ? match.ignored : false
			expect(isIgnored).toBe(false)
		}
	})
})
