/* oxlint-disable */
// Port of the complete Git wildmatch unit test suite.
// Reference: https://github.com/git/git/blob/13c7afec212fc97ce257d15601659314c6673d6c/t/t3070-wildmatch.sh

import type { FsAdapter } from "../scan.js"

import { describe, test, expect } from "bun:test"
import { createFsFromVolume, Volume } from "memfs"

import { scan } from "../browser_scan.js"
import { makeGit } from "../targets/git.js"

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

describe.skipIf(!process.env.TEST_WILDMATCH)("git wildmatch compatibility tests", () => {
	test('pathmatch case 0: text="foo" pattern="foo"', async () => {
		const gitignoreContent = "foo"
		const allPaths = ["foo"]
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

		const expectedIgnored = true
		const match = scanResult.paths.get("foo")
		const isIgnored = match ? match.ignored : false

		expect(isIgnored).toBe(expectedIgnored)
	})

	test('pathmatch case 1: text="foo" pattern="bar"', async () => {
		const gitignoreContent = "bar"
		const allPaths = ["foo"]
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

		const expectedIgnored = false
		const match = scanResult.paths.get("foo")
		const isIgnored = match ? match.ignored : false

		expect(isIgnored).toBe(expectedIgnored)
	})

	test('pathmatch case 2: text="foo" pattern="???"', async () => {
		const gitignoreContent = "???"
		const allPaths = ["foo"]
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

		const expectedIgnored = true
		const match = scanResult.paths.get("foo")
		const isIgnored = match ? match.ignored : false

		expect(isIgnored).toBe(expectedIgnored)
	})

	test('pathmatch case 3: text="foo" pattern="??"', async () => {
		const gitignoreContent = "??"
		const allPaths = ["foo"]
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

		const expectedIgnored = false
		const match = scanResult.paths.get("foo")
		const isIgnored = match ? match.ignored : false

		expect(isIgnored).toBe(expectedIgnored)
	})

	test('pathmatch case 4: text="foo" pattern="*"', async () => {
		const gitignoreContent = "*"
		const allPaths = ["foo"]
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

		const expectedIgnored = true
		const match = scanResult.paths.get("foo")
		const isIgnored = match ? match.ignored : false

		expect(isIgnored).toBe(expectedIgnored)
	})

	test('pathmatch case 5: text="foo" pattern="f*"', async () => {
		const gitignoreContent = "f*"
		const allPaths = ["foo"]
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

		const expectedIgnored = true
		const match = scanResult.paths.get("foo")
		const isIgnored = match ? match.ignored : false

		expect(isIgnored).toBe(expectedIgnored)
	})

	test('pathmatch case 6: text="foo" pattern="*f"', async () => {
		const gitignoreContent = "*f"
		const allPaths = ["foo"]
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

		const expectedIgnored = false
		const match = scanResult.paths.get("foo")
		const isIgnored = match ? match.ignored : false

		expect(isIgnored).toBe(expectedIgnored)
	})

	test('pathmatch case 7: text="foo" pattern="*foo*"', async () => {
		const gitignoreContent = "*foo*"
		const allPaths = ["foo"]
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

		const expectedIgnored = true
		const match = scanResult.paths.get("foo")
		const isIgnored = match ? match.ignored : false

		expect(isIgnored).toBe(expectedIgnored)
	})

	test('pathmatch case 8: text="foobar" pattern="*ob*a*r*"', async () => {
		const gitignoreContent = "*ob*a*r*"
		const allPaths = ["foobar"]
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

		const expectedIgnored = true
		const match = scanResult.paths.get("foobar")
		const isIgnored = match ? match.ignored : false

		expect(isIgnored).toBe(expectedIgnored)
	})

	test('pathmatch case 9: text="aaaaaaabababab" pattern="*ab"', async () => {
		const gitignoreContent = "*ab"
		const allPaths = ["aaaaaaabababab"]
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

		const expectedIgnored = true
		const match = scanResult.paths.get("aaaaaaabababab")
		const isIgnored = match ? match.ignored : false

		expect(isIgnored).toBe(expectedIgnored)
	})

	test('pathmatch case 10: text="foo*" pattern="foo\\*"', async () => {
		const gitignoreContent = "foo\\*"
		const allPaths = ["foo*"]
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

		const expectedIgnored = true
		const match = scanResult.paths.get("foo*")
		const isIgnored = match ? match.ignored : false

		expect(isIgnored).toBe(expectedIgnored)
	})

	test('pathmatch case 11: text="foobar" pattern="foo\\*bar"', async () => {
		const gitignoreContent = "foo\\*bar"
		const allPaths = ["foobar"]
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

		const expectedIgnored = false
		const match = scanResult.paths.get("foobar")
		const isIgnored = match ? match.ignored : false

		expect(isIgnored).toBe(expectedIgnored)
	})

	test('pathmatch case 12: text="ball" pattern="*[al]?"', async () => {
		const gitignoreContent = "*[al]?"
		const allPaths = ["ball"]
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

		const expectedIgnored = true
		const match = scanResult.paths.get("ball")
		const isIgnored = match ? match.ignored : false

		expect(isIgnored).toBe(expectedIgnored)
	})

	test('pathmatch case 13: text="ten" pattern="[ten]"', async () => {
		const gitignoreContent = "[ten]"
		const allPaths = ["ten"]
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

		const expectedIgnored = false
		const match = scanResult.paths.get("ten")
		const isIgnored = match ? match.ignored : false

		expect(isIgnored).toBe(expectedIgnored)
	})

	test('pathmatch case 14: text="ten" pattern="**[!te]"', async () => {
		const gitignoreContent = "**[!te]"
		const allPaths = ["ten"]
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

		const expectedIgnored = true
		const match = scanResult.paths.get("ten")
		const isIgnored = match ? match.ignored : false

		expect(isIgnored).toBe(expectedIgnored)
	})

	test('pathmatch case 15: text="ten" pattern="**[!ten]"', async () => {
		const gitignoreContent = "**[!ten]"
		const allPaths = ["ten"]
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

		const expectedIgnored = false
		const match = scanResult.paths.get("ten")
		const isIgnored = match ? match.ignored : false

		expect(isIgnored).toBe(expectedIgnored)
	})

	test('pathmatch case 16: text="ten" pattern="t[a-g]n"', async () => {
		const gitignoreContent = "t[a-g]n"
		const allPaths = ["ten"]
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

		const expectedIgnored = true
		const match = scanResult.paths.get("ten")
		const isIgnored = match ? match.ignored : false

		expect(isIgnored).toBe(expectedIgnored)
	})

	test('pathmatch case 17: text="ten" pattern="t[!a-g]n"', async () => {
		const gitignoreContent = "t[!a-g]n"
		const allPaths = ["ten"]
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

		const expectedIgnored = false
		const match = scanResult.paths.get("ten")
		const isIgnored = match ? match.ignored : false

		expect(isIgnored).toBe(expectedIgnored)
	})

	test('pathmatch case 18: text="ton" pattern="t[!a-g]n"', async () => {
		const gitignoreContent = "t[!a-g]n"
		const allPaths = ["ton"]
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

		const expectedIgnored = true
		const match = scanResult.paths.get("ton")
		const isIgnored = match ? match.ignored : false

		expect(isIgnored).toBe(expectedIgnored)
	})

	test('pathmatch case 19: text="ton" pattern="t[^a-g]n"', async () => {
		const gitignoreContent = "t[^a-g]n"
		const allPaths = ["ton"]
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

		const expectedIgnored = true
		const match = scanResult.paths.get("ton")
		const isIgnored = match ? match.ignored : false

		expect(isIgnored).toBe(expectedIgnored)
	})

	test('pathmatch case 20: text="a]b" pattern="a[]]b"', async () => {
		const gitignoreContent = "a[]]b"
		const allPaths = ["a]b"]
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

		const expectedIgnored = true
		const match = scanResult.paths.get("a]b")
		const isIgnored = match ? match.ignored : false

		expect(isIgnored).toBe(expectedIgnored)
	})

	test('pathmatch case 21: text="a-b" pattern="a[]-]b"', async () => {
		const gitignoreContent = "a[]-]b"
		const allPaths = ["a-b"]
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

		const expectedIgnored = true
		const match = scanResult.paths.get("a-b")
		const isIgnored = match ? match.ignored : false

		expect(isIgnored).toBe(expectedIgnored)
	})

	test('pathmatch case 22: text="a]b" pattern="a[]-]b"', async () => {
		const gitignoreContent = "a[]-]b"
		const allPaths = ["a]b"]
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

		const expectedIgnored = true
		const match = scanResult.paths.get("a]b")
		const isIgnored = match ? match.ignored : false

		expect(isIgnored).toBe(expectedIgnored)
	})

	test('pathmatch case 23: text="aab" pattern="a[]-]b"', async () => {
		const gitignoreContent = "a[]-]b"
		const allPaths = ["aab"]
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

		const expectedIgnored = false
		const match = scanResult.paths.get("aab")
		const isIgnored = match ? match.ignored : false

		expect(isIgnored).toBe(expectedIgnored)
	})

	test('pathmatch case 24: text="aab" pattern="a[]a-]b"', async () => {
		const gitignoreContent = "a[]a-]b"
		const allPaths = ["aab"]
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

		const expectedIgnored = true
		const match = scanResult.paths.get("aab")
		const isIgnored = match ? match.ignored : false

		expect(isIgnored).toBe(expectedIgnored)
	})

	test('pathmatch case 25: text="]" pattern="]"', async () => {
		const gitignoreContent = "]"
		const allPaths = ["]"]
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

		const expectedIgnored = true
		const match = scanResult.paths.get("]")
		const isIgnored = match ? match.ignored : false

		expect(isIgnored).toBe(expectedIgnored)
	})

	test('pathmatch case 26: text="foo/baz/bar" pattern="foo*bar"', async () => {
		const gitignoreContent = "foo*bar"
		const allPaths = ["foo/baz/bar"]
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

		const expectedIgnored = true
		const match = scanResult.paths.get("foo/baz/bar")
		const isIgnored = match ? match.ignored : false

		expect(isIgnored).toBe(expectedIgnored)
	})

	test('pathmatch case 27: text="foo/baz/bar" pattern="foo**bar"', async () => {
		const gitignoreContent = "foo**bar"
		const allPaths = ["foo/baz/bar"]
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

		const expectedIgnored = true
		const match = scanResult.paths.get("foo/baz/bar")
		const isIgnored = match ? match.ignored : false

		expect(isIgnored).toBe(expectedIgnored)
	})

	test('pathmatch case 28: text="foobazbar" pattern="foo**bar"', async () => {
		const gitignoreContent = "foo**bar"
		const allPaths = ["foobazbar"]
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

		const expectedIgnored = true
		const match = scanResult.paths.get("foobazbar")
		const isIgnored = match ? match.ignored : false

		expect(isIgnored).toBe(expectedIgnored)
	})

	test('pathmatch case 29: text="foo/baz/bar" pattern="foo/**/bar"', async () => {
		const gitignoreContent = "foo/**/bar"
		const allPaths = ["foo/baz/bar"]
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

		const expectedIgnored = true
		const match = scanResult.paths.get("foo/baz/bar")
		const isIgnored = match ? match.ignored : false

		expect(isIgnored).toBe(expectedIgnored)
	})

	test('pathmatch case 30: text="foo/baz/bar" pattern="foo/**/**/bar"', async () => {
		const gitignoreContent = "foo/**/**/bar"
		const allPaths = ["foo/baz/bar"]
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

		const expectedIgnored = false
		const match = scanResult.paths.get("foo/baz/bar")
		const isIgnored = match ? match.ignored : false

		expect(isIgnored).toBe(expectedIgnored)
	})

	test('pathmatch case 31: text="foo/b/a/z/bar" pattern="foo/**/bar"', async () => {
		const gitignoreContent = "foo/**/bar"
		const allPaths = ["foo/b/a/z/bar"]
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

		const expectedIgnored = true
		const match = scanResult.paths.get("foo/b/a/z/bar")
		const isIgnored = match ? match.ignored : false

		expect(isIgnored).toBe(expectedIgnored)
	})

	test('pathmatch case 32: text="foo/b/a/z/bar" pattern="foo/**/**/bar"', async () => {
		const gitignoreContent = "foo/**/**/bar"
		const allPaths = ["foo/b/a/z/bar"]
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

		const expectedIgnored = true
		const match = scanResult.paths.get("foo/b/a/z/bar")
		const isIgnored = match ? match.ignored : false

		expect(isIgnored).toBe(expectedIgnored)
	})

	test('pathmatch case 33: text="foo/bar" pattern="foo/**/bar"', async () => {
		const gitignoreContent = "foo/**/bar"
		const allPaths = ["foo/bar"]
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

		const expectedIgnored = false
		const match = scanResult.paths.get("foo/bar")
		const isIgnored = match ? match.ignored : false

		expect(isIgnored).toBe(expectedIgnored)
	})

	test('pathmatch case 34: text="foo/bar" pattern="foo/**/**/bar"', async () => {
		const gitignoreContent = "foo/**/**/bar"
		const allPaths = ["foo/bar"]
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

		const expectedIgnored = false
		const match = scanResult.paths.get("foo/bar")
		const isIgnored = match ? match.ignored : false

		expect(isIgnored).toBe(expectedIgnored)
	})

	test('pathmatch case 35: text="foo/bar" pattern="foo?bar"', async () => {
		const gitignoreContent = "foo?bar"
		const allPaths = ["foo/bar"]
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

		const expectedIgnored = true
		const match = scanResult.paths.get("foo/bar")
		const isIgnored = match ? match.ignored : false

		expect(isIgnored).toBe(expectedIgnored)
	})

	test('pathmatch case 36: text="foo/bar" pattern="foo[/]bar"', async () => {
		const gitignoreContent = "foo[/]bar"
		const allPaths = ["foo/bar"]
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

		const expectedIgnored = true
		const match = scanResult.paths.get("foo/bar")
		const isIgnored = match ? match.ignored : false

		expect(isIgnored).toBe(expectedIgnored)
	})

	test('pathmatch case 37: text="foo/bar" pattern="foo[^a-z]bar"', async () => {
		const gitignoreContent = "foo[^a-z]bar"
		const allPaths = ["foo/bar"]
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

		const expectedIgnored = true
		const match = scanResult.paths.get("foo/bar")
		const isIgnored = match ? match.ignored : false

		expect(isIgnored).toBe(expectedIgnored)
	})

	test('pathmatch case 38: text="foo/bar" pattern="f[^eiu][^eiu][^eiu][^eiu][^eiu]r"', async () => {
		const gitignoreContent = "f[^eiu][^eiu][^eiu][^eiu][^eiu]r"
		const allPaths = ["foo/bar"]
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

		const expectedIgnored = true
		const match = scanResult.paths.get("foo/bar")
		const isIgnored = match ? match.ignored : false

		expect(isIgnored).toBe(expectedIgnored)
	})

	test('pathmatch case 39: text="foo-bar" pattern="f[^eiu][^eiu][^eiu][^eiu][^eiu]r"', async () => {
		const gitignoreContent = "f[^eiu][^eiu][^eiu][^eiu][^eiu]r"
		const allPaths = ["foo-bar"]
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

		const expectedIgnored = true
		const match = scanResult.paths.get("foo-bar")
		const isIgnored = match ? match.ignored : false

		expect(isIgnored).toBe(expectedIgnored)
	})

	test('pathmatch case 40: text="foo" pattern="**/foo"', async () => {
		const gitignoreContent = "**/foo"
		const allPaths = ["foo"]
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

		const expectedIgnored = false
		const match = scanResult.paths.get("foo")
		const isIgnored = match ? match.ignored : false

		expect(isIgnored).toBe(expectedIgnored)
	})

	test('pathmatch case 41: text="XXX/foo" pattern="**/foo"', async () => {
		const gitignoreContent = "**/foo"
		const allPaths = ["XXX/foo"]
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

		const expectedIgnored = true
		const match = scanResult.paths.get("XXX/foo")
		const isIgnored = match ? match.ignored : false

		expect(isIgnored).toBe(expectedIgnored)
	})

	test('pathmatch case 42: text="bar/baz/foo" pattern="**/foo"', async () => {
		const gitignoreContent = "**/foo"
		const allPaths = ["bar/baz/foo"]
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

		const expectedIgnored = true
		const match = scanResult.paths.get("bar/baz/foo")
		const isIgnored = match ? match.ignored : false

		expect(isIgnored).toBe(expectedIgnored)
	})

	test('pathmatch case 43: text="bar/baz/foo" pattern="*/foo"', async () => {
		const gitignoreContent = "*/foo"
		const allPaths = ["bar/baz/foo"]
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

		const expectedIgnored = true
		const match = scanResult.paths.get("bar/baz/foo")
		const isIgnored = match ? match.ignored : false

		expect(isIgnored).toBe(expectedIgnored)
	})

	test('pathmatch case 44: text="foo/bar/baz" pattern="**/bar*"', async () => {
		const gitignoreContent = "**/bar*"
		const allPaths = ["foo/bar/baz"]
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

		const expectedIgnored = true
		const match = scanResult.paths.get("foo/bar/baz")
		const isIgnored = match ? match.ignored : false

		expect(isIgnored).toBe(expectedIgnored)
	})

	test('pathmatch case 45: text="deep/foo/bar/baz" pattern="**/bar/*"', async () => {
		const gitignoreContent = "**/bar/*"
		const allPaths = ["deep/foo/bar/baz"]
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

		const expectedIgnored = true
		const match = scanResult.paths.get("deep/foo/bar/baz")
		const isIgnored = match ? match.ignored : false

		expect(isIgnored).toBe(expectedIgnored)
	})

	test('pathmatch case 46: text="deep/foo/bar/baz/" pattern="**/bar/*"', async () => {
		const gitignoreContent = "**/bar/*"
		const allPaths = ["deep/foo/bar/baz/"]
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

		const expectedIgnored = true
		const match = scanResult.paths.get("deep/foo/bar/baz/")
		const isIgnored = match ? match.ignored : false

		expect(isIgnored).toBe(expectedIgnored)
	})

	test('pathmatch case 47: text="deep/foo/bar/baz/" pattern="**/bar/**"', async () => {
		const gitignoreContent = "**/bar/**"
		const allPaths = ["deep/foo/bar/baz/"]
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

		const expectedIgnored = true
		const match = scanResult.paths.get("deep/foo/bar/baz/")
		const isIgnored = match ? match.ignored : false

		expect(isIgnored).toBe(expectedIgnored)
	})

	test('pathmatch case 48: text="deep/foo/bar" pattern="**/bar/*"', async () => {
		const gitignoreContent = "**/bar/*"
		const allPaths = ["deep/foo/bar"]
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

		const expectedIgnored = false
		const match = scanResult.paths.get("deep/foo/bar")
		const isIgnored = match ? match.ignored : false

		expect(isIgnored).toBe(expectedIgnored)
	})

	test('pathmatch case 49: text="deep/foo/bar/" pattern="**/bar/**"', async () => {
		const gitignoreContent = "**/bar/**"
		const allPaths = ["deep/foo/bar/"]
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

		const expectedIgnored = true
		const match = scanResult.paths.get("deep/foo/bar/")
		const isIgnored = match ? match.ignored : false

		expect(isIgnored).toBe(expectedIgnored)
	})

	test('pathmatch case 50: text="foo/bar/baz" pattern="**/bar**"', async () => {
		const gitignoreContent = "**/bar**"
		const allPaths = ["foo/bar/baz"]
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

		const expectedIgnored = true
		const match = scanResult.paths.get("foo/bar/baz")
		const isIgnored = match ? match.ignored : false

		expect(isIgnored).toBe(expectedIgnored)
	})

	test('pathmatch case 51: text="foo/bar/baz/x" pattern="*/bar/**"', async () => {
		const gitignoreContent = "*/bar/**"
		const allPaths = ["foo/bar/baz/x"]
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

		const expectedIgnored = true
		const match = scanResult.paths.get("foo/bar/baz/x")
		const isIgnored = match ? match.ignored : false

		expect(isIgnored).toBe(expectedIgnored)
	})

	test('pathmatch case 52: text="deep/foo/bar/baz/x" pattern="*/bar/**"', async () => {
		const gitignoreContent = "*/bar/**"
		const allPaths = ["deep/foo/bar/baz/x"]
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

		const expectedIgnored = true
		const match = scanResult.paths.get("deep/foo/bar/baz/x")
		const isIgnored = match ? match.ignored : false

		expect(isIgnored).toBe(expectedIgnored)
	})

	test('pathmatch case 53: text="deep/foo/bar/baz/x" pattern="**/bar/*/*"', async () => {
		const gitignoreContent = "**/bar/*/*"
		const allPaths = ["deep/foo/bar/baz/x"]
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

		const expectedIgnored = true
		const match = scanResult.paths.get("deep/foo/bar/baz/x")
		const isIgnored = match ? match.ignored : false

		expect(isIgnored).toBe(expectedIgnored)
	})

	test('pathmatch case 54: text="acrt" pattern="a[c-c]st"', async () => {
		const gitignoreContent = "a[c-c]st"
		const allPaths = ["acrt"]
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

		const expectedIgnored = false
		const match = scanResult.paths.get("acrt")
		const isIgnored = match ? match.ignored : false

		expect(isIgnored).toBe(expectedIgnored)
	})

	test('pathmatch case 55: text="acrt" pattern="a[c-c]rt"', async () => {
		const gitignoreContent = "a[c-c]rt"
		const allPaths = ["acrt"]
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

		const expectedIgnored = true
		const match = scanResult.paths.get("acrt")
		const isIgnored = match ? match.ignored : false

		expect(isIgnored).toBe(expectedIgnored)
	})

	test('pathmatch case 56: text="]" pattern="[!]-]"', async () => {
		const gitignoreContent = "[!]-]"
		const allPaths = ["]"]
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

		const expectedIgnored = false
		const match = scanResult.paths.get("]")
		const isIgnored = match ? match.ignored : false

		expect(isIgnored).toBe(expectedIgnored)
	})

	test('pathmatch case 57: text="a" pattern="[!]-]"', async () => {
		const gitignoreContent = "[!]-]"
		const allPaths = ["a"]
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

		const expectedIgnored = true
		const match = scanResult.paths.get("a")
		const isIgnored = match ? match.ignored : false

		expect(isIgnored).toBe(expectedIgnored)
	})

	test('pathmatch case 58: text="foo" pattern="foo"', async () => {
		const gitignoreContent = "foo"
		const allPaths = ["foo"]
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

		const expectedIgnored = true
		const match = scanResult.paths.get("foo")
		const isIgnored = match ? match.ignored : false

		expect(isIgnored).toBe(expectedIgnored)
	})

	test('pathmatch case 59: text="@foo" pattern="@foo"', async () => {
		const gitignoreContent = "@foo"
		const allPaths = ["@foo"]
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

		const expectedIgnored = true
		const match = scanResult.paths.get("@foo")
		const isIgnored = match ? match.ignored : false

		expect(isIgnored).toBe(expectedIgnored)
	})

	test('pathmatch case 60: text="foo" pattern="@foo"', async () => {
		const gitignoreContent = "@foo"
		const allPaths = ["foo"]
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

		const expectedIgnored = false
		const match = scanResult.paths.get("foo")
		const isIgnored = match ? match.ignored : false

		expect(isIgnored).toBe(expectedIgnored)
	})

	test('pathmatch case 61: text="[ab]" pattern="\\[ab]"', async () => {
		const gitignoreContent = "\\[ab]"
		const allPaths = ["[ab]"]
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

		const expectedIgnored = true
		const match = scanResult.paths.get("[ab]")
		const isIgnored = match ? match.ignored : false

		expect(isIgnored).toBe(expectedIgnored)
	})

	test('pathmatch case 62: text="[ab]" pattern="[[]ab]"', async () => {
		const gitignoreContent = "[[]ab]"
		const allPaths = ["[ab]"]
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

		const expectedIgnored = true
		const match = scanResult.paths.get("[ab]")
		const isIgnored = match ? match.ignored : false

		expect(isIgnored).toBe(expectedIgnored)
	})

	test('pathmatch case 63: text="[ab]" pattern="[[:]ab]"', async () => {
		const gitignoreContent = "[[:]ab]"
		const allPaths = ["[ab]"]
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

		const expectedIgnored = true
		const match = scanResult.paths.get("[ab]")
		const isIgnored = match ? match.ignored : false

		expect(isIgnored).toBe(expectedIgnored)
	})

	test('pathmatch case 64: text="[ab]" pattern="[[::]ab]"', async () => {
		const gitignoreContent = "[[::]ab]"
		const allPaths = ["[ab]"]
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

		const expectedIgnored = false
		const match = scanResult.paths.get("[ab]")
		const isIgnored = match ? match.ignored : false

		expect(isIgnored).toBe(expectedIgnored)
	})

	test('pathmatch case 65: text="[ab]" pattern="[[:digit]ab]"', async () => {
		const gitignoreContent = "[[:digit]ab]"
		const allPaths = ["[ab]"]
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

		const expectedIgnored = true
		const match = scanResult.paths.get("[ab]")
		const isIgnored = match ? match.ignored : false

		expect(isIgnored).toBe(expectedIgnored)
	})

	test('pathmatch case 66: text="[ab]" pattern="[\\[:]ab]"', async () => {
		const gitignoreContent = "[\\[:]ab]"
		const allPaths = ["[ab]"]
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

		const expectedIgnored = true
		const match = scanResult.paths.get("[ab]")
		const isIgnored = match ? match.ignored : false

		expect(isIgnored).toBe(expectedIgnored)
	})

	test('pathmatch case 67: text="?a?b" pattern="\\??\\?b"', async () => {
		const gitignoreContent = "\\??\\?b"
		const allPaths = ["?a?b"]
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

		const expectedIgnored = true
		const match = scanResult.paths.get("?a?b")
		const isIgnored = match ? match.ignored : false

		expect(isIgnored).toBe(expectedIgnored)
	})

	test('pathmatch case 68: text="abc" pattern="\\a\\b\\c"', async () => {
		const gitignoreContent = "\\a\\b\\c"
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

		const expectedIgnored = true
		const match = scanResult.paths.get("abc")
		const isIgnored = match ? match.ignored : false

		expect(isIgnored).toBe(expectedIgnored)
	})

	test('pathmatch case 70: text="foo/bar/baz/to" pattern="**/t[o]"', async () => {
		const gitignoreContent = "**/t[o]"
		const allPaths = ["foo/bar/baz/to"]
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

		const expectedIgnored = true
		const match = scanResult.paths.get("foo/bar/baz/to")
		const isIgnored = match ? match.ignored : false

		expect(isIgnored).toBe(expectedIgnored)
	})

	test('pathmatch case 71: text="a1B" pattern="[[:alpha:]][[:digit:]][[:upper:]]"', async () => {
		const gitignoreContent = "[[:alpha:]][[:digit:]][[:upper:]]"
		const allPaths = ["a1B"]
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

		const expectedIgnored = true
		const match = scanResult.paths.get("a1B")
		const isIgnored = match ? match.ignored : false

		expect(isIgnored).toBe(expectedIgnored)
	})

	test('pathmatch case 72: text="a" pattern="[[:digit:][:upper:][:space:]]"', async () => {
		const gitignoreContent = "[[:digit:][:upper:][:space:]]"
		const allPaths = ["a"]
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

		const expectedIgnored = false
		const match = scanResult.paths.get("a")
		const isIgnored = match ? match.ignored : false

		expect(isIgnored).toBe(expectedIgnored)
	})

	test('pathmatch case 73: text="A" pattern="[[:digit:][:upper:][:space:]]"', async () => {
		const gitignoreContent = "[[:digit:][:upper:][:space:]]"
		const allPaths = ["A"]
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

		const expectedIgnored = true
		const match = scanResult.paths.get("A")
		const isIgnored = match ? match.ignored : false

		expect(isIgnored).toBe(expectedIgnored)
	})

	test('pathmatch case 74: text="1" pattern="[[:digit:][:upper:][:space:]]"', async () => {
		const gitignoreContent = "[[:digit:][:upper:][:space:]]"
		const allPaths = ["1"]
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

		const expectedIgnored = true
		const match = scanResult.paths.get("1")
		const isIgnored = match ? match.ignored : false

		expect(isIgnored).toBe(expectedIgnored)
	})

	test('pathmatch case 75: text="1" pattern="[[:digit:][:upper:][:spaci:]]"', async () => {
		const gitignoreContent = "[[:digit:][:upper:][:spaci:]]"
		const allPaths = ["1"]
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

		const expectedIgnored = false
		const match = scanResult.paths.get("1")
		const isIgnored = match ? match.ignored : false

		expect(isIgnored).toBe(expectedIgnored)
	})

	test('pathmatch case 76: text=" " pattern="[[:digit:][:upper:][:space:]]"', async () => {
		const gitignoreContent = "[[:digit:][:upper:][:space:]]"
		const allPaths = [" "]
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

		const expectedIgnored = true
		const match = scanResult.paths.get(" ")
		const isIgnored = match ? match.ignored : false

		expect(isIgnored).toBe(expectedIgnored)
	})

	test('pathmatch case 77: text="5" pattern="[[:xdigit:]]"', async () => {
		const gitignoreContent = "[[:xdigit:]]"
		const allPaths = ["5"]
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

		const expectedIgnored = true
		const match = scanResult.paths.get("5")
		const isIgnored = match ? match.ignored : false

		expect(isIgnored).toBe(expectedIgnored)
	})

	test('pathmatch case 78: text="f" pattern="[[:xdigit:]]"', async () => {
		const gitignoreContent = "[[:xdigit:]]"
		const allPaths = ["f"]
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

		const expectedIgnored = true
		const match = scanResult.paths.get("f")
		const isIgnored = match ? match.ignored : false

		expect(isIgnored).toBe(expectedIgnored)
	})

	test('pathmatch case 79: text="D" pattern="[[:xdigit:]]"', async () => {
		const gitignoreContent = "[[:xdigit:]]"
		const allPaths = ["D"]
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

		const expectedIgnored = true
		const match = scanResult.paths.get("D")
		const isIgnored = match ? match.ignored : false

		expect(isIgnored).toBe(expectedIgnored)
	})

	test('pathmatch case 80: text="_" pattern="[[:alnum:][:alpha:][:blank:][:cntrl:][:digit:][:graph:][:lower:][:print:][:punct:][:space:][:upper:][:xdigit:]]"', async () => {
		const gitignoreContent =
			"[[:alnum:][:alpha:][:blank:][:cntrl:][:digit:][:graph:][:lower:][:print:][:punct:][:space:][:upper:][:xdigit:]]"
		const allPaths = ["_"]
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

		const expectedIgnored = true
		const match = scanResult.paths.get("_")
		const isIgnored = match ? match.ignored : false

		expect(isIgnored).toBe(expectedIgnored)
	})

	test('pathmatch case 81: text="5" pattern="[a-c[:digit:]x-z]"', async () => {
		const gitignoreContent = "[a-c[:digit:]x-z]"
		const allPaths = ["5"]
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

		const expectedIgnored = true
		const match = scanResult.paths.get("5")
		const isIgnored = match ? match.ignored : false

		expect(isIgnored).toBe(expectedIgnored)
	})

	test('pathmatch case 82: text="b" pattern="[a-c[:digit:]x-z]"', async () => {
		const gitignoreContent = "[a-c[:digit:]x-z]"
		const allPaths = ["b"]
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

		const expectedIgnored = true
		const match = scanResult.paths.get("b")
		const isIgnored = match ? match.ignored : false

		expect(isIgnored).toBe(expectedIgnored)
	})

	test('pathmatch case 83: text="y" pattern="[a-c[:digit:]x-z]"', async () => {
		const gitignoreContent = "[a-c[:digit:]x-z]"
		const allPaths = ["y"]
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

		const expectedIgnored = true
		const match = scanResult.paths.get("y")
		const isIgnored = match ? match.ignored : false

		expect(isIgnored).toBe(expectedIgnored)
	})

	test('pathmatch case 84: text="q" pattern="[a-c[:digit:]x-z]"', async () => {
		const gitignoreContent = "[a-c[:digit:]x-z]"
		const allPaths = ["q"]
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

		const expectedIgnored = false
		const match = scanResult.paths.get("q")
		const isIgnored = match ? match.ignored : false

		expect(isIgnored).toBe(expectedIgnored)
	})

	test('pathmatch case 85: text="]" pattern="[\\-\\-^]"', async () => {
		const gitignoreContent = "[\\-\\-^]"
		const allPaths = ["]"]
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

		const expectedIgnored = true
		const match = scanResult.paths.get("]")
		const isIgnored = match ? match.ignored : false

		expect(isIgnored).toBe(expectedIgnored)
	})

	test('pathmatch case 86: text="]" pattern="[\\\\-^]"', async () => {
		const gitignoreContent = "[\\\\-^]"
		const allPaths = ["]"]
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

		const expectedIgnored = true
		const match = scanResult.paths.get("]")
		const isIgnored = match ? match.ignored : false

		expect(isIgnored).toBe(expectedIgnored)
	})

	test('pathmatch case 87: text="[" pattern="[\\\\-^]"', async () => {
		const gitignoreContent = "[\\\\-^]"
		const allPaths = ["["]
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

		const expectedIgnored = false
		const match = scanResult.paths.get("[")
		const isIgnored = match ? match.ignored : false

		expect(isIgnored).toBe(expectedIgnored)
	})

	test('pathmatch case 88: text="-" pattern="[\\-_]"', async () => {
		const gitignoreContent = "[\\-_]"
		const allPaths = ["-"]
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

		const expectedIgnored = true
		const match = scanResult.paths.get("-")
		const isIgnored = match ? match.ignored : false

		expect(isIgnored).toBe(expectedIgnored)
	})

	test('pathmatch case 89: text="]" pattern="[\\]]"', async () => {
		const gitignoreContent = "[\\]]"
		const allPaths = ["]"]
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

		const expectedIgnored = true
		const match = scanResult.paths.get("]")
		const isIgnored = match ? match.ignored : false

		expect(isIgnored).toBe(expectedIgnored)
	})

	test('pathmatch case 90: text="ab" pattern="a[]b"', async () => {
		const gitignoreContent = "a[]b"
		const allPaths = ["ab"]
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

		const expectedIgnored = false
		const match = scanResult.paths.get("ab")
		const isIgnored = match ? match.ignored : false

		expect(isIgnored).toBe(expectedIgnored)
	})

	test('pathmatch case 91: text="a[]b" pattern="a[]b"', async () => {
		const gitignoreContent = "a[]b"
		const allPaths = ["a[]b"]
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

		const expectedIgnored = true
		const match = scanResult.paths.get("a[]b")
		const isIgnored = match ? match.ignored : false

		expect(isIgnored).toBe(expectedIgnored)
	})

	test('pathmatch case 92: text="ab[" pattern="ab["', async () => {
		const gitignoreContent = "ab["
		const allPaths = ["ab["]
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

		const expectedIgnored = true
		const match = scanResult.paths.get("ab[")
		const isIgnored = match ? match.ignored : false

		expect(isIgnored).toBe(expectedIgnored)
	})

	test('pathmatch case 93: text="ab" pattern="[!"', async () => {
		const gitignoreContent = "[!"
		const allPaths = ["ab"]
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

		const expectedIgnored = false
		const match = scanResult.paths.get("ab")
		const isIgnored = match ? match.ignored : false

		expect(isIgnored).toBe(expectedIgnored)
	})

	test('pathmatch case 94: text="ab" pattern="[-"', async () => {
		const gitignoreContent = "[-"
		const allPaths = ["ab"]
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

		const expectedIgnored = false
		const match = scanResult.paths.get("ab")
		const isIgnored = match ? match.ignored : false

		expect(isIgnored).toBe(expectedIgnored)
	})

	test('pathmatch case 95: text="-" pattern="[-]"', async () => {
		const gitignoreContent = "[-]"
		const allPaths = ["-"]
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

		const expectedIgnored = true
		const match = scanResult.paths.get("-")
		const isIgnored = match ? match.ignored : false

		expect(isIgnored).toBe(expectedIgnored)
	})

	test('pathmatch case 96: text="-" pattern="[a-"', async () => {
		const gitignoreContent = "[a-"
		const allPaths = ["-"]
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

		const expectedIgnored = false
		const match = scanResult.paths.get("-")
		const isIgnored = match ? match.ignored : false

		expect(isIgnored).toBe(expectedIgnored)
	})

	test('pathmatch case 97: text="-" pattern="[!a-"', async () => {
		const gitignoreContent = "[!a-"
		const allPaths = ["-"]
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

		const expectedIgnored = false
		const match = scanResult.paths.get("-")
		const isIgnored = match ? match.ignored : false

		expect(isIgnored).toBe(expectedIgnored)
	})

	test('pathmatch case 98: text="-" pattern="[--A]"', async () => {
		const gitignoreContent = "[--A]"
		const allPaths = ["-"]
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

		const expectedIgnored = true
		const match = scanResult.paths.get("-")
		const isIgnored = match ? match.ignored : false

		expect(isIgnored).toBe(expectedIgnored)
	})

	test('pathmatch case 99: text="5" pattern="[--A]"', async () => {
		const gitignoreContent = "[--A]"
		const allPaths = ["5"]
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

		const expectedIgnored = true
		const match = scanResult.paths.get("5")
		const isIgnored = match ? match.ignored : false

		expect(isIgnored).toBe(expectedIgnored)
	})

	test('pathmatch case 100: text=" " pattern="[ --]"', async () => {
		const gitignoreContent = "[ --]"
		const allPaths = [" "]
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

		const expectedIgnored = true
		const match = scanResult.paths.get(" ")
		const isIgnored = match ? match.ignored : false

		expect(isIgnored).toBe(expectedIgnored)
	})

	test('pathmatch case 101: text="$" pattern="[ --]"', async () => {
		const gitignoreContent = "[ --]"
		const allPaths = ["$"]
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

		const expectedIgnored = true
		const match = scanResult.paths.get("$")
		const isIgnored = match ? match.ignored : false

		expect(isIgnored).toBe(expectedIgnored)
	})

	test('pathmatch case 102: text="-" pattern="[ --]"', async () => {
		const gitignoreContent = "[ --]"
		const allPaths = ["-"]
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

		const expectedIgnored = true
		const match = scanResult.paths.get("-")
		const isIgnored = match ? match.ignored : false

		expect(isIgnored).toBe(expectedIgnored)
	})

	test('pathmatch case 103: text="0" pattern="[ --]"', async () => {
		const gitignoreContent = "[ --]"
		const allPaths = ["0"]
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

		const expectedIgnored = false
		const match = scanResult.paths.get("0")
		const isIgnored = match ? match.ignored : false

		expect(isIgnored).toBe(expectedIgnored)
	})

	test('pathmatch case 104: text="-" pattern="[---]"', async () => {
		const gitignoreContent = "[---]"
		const allPaths = ["-"]
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

		const expectedIgnored = true
		const match = scanResult.paths.get("-")
		const isIgnored = match ? match.ignored : false

		expect(isIgnored).toBe(expectedIgnored)
	})

	test('pathmatch case 105: text="-" pattern="[------]"', async () => {
		const gitignoreContent = "[------]"
		const allPaths = ["-"]
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

		const expectedIgnored = true
		const match = scanResult.paths.get("-")
		const isIgnored = match ? match.ignored : false

		expect(isIgnored).toBe(expectedIgnored)
	})

	test('pathmatch case 106: text="j" pattern="[a-e-n]"', async () => {
		const gitignoreContent = "[a-e-n]"
		const allPaths = ["j"]
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

		const expectedIgnored = false
		const match = scanResult.paths.get("j")
		const isIgnored = match ? match.ignored : false

		expect(isIgnored).toBe(expectedIgnored)
	})

	test('pathmatch case 107: text="-" pattern="[a-e-n]"', async () => {
		const gitignoreContent = "[a-e-n]"
		const allPaths = ["-"]
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

		const expectedIgnored = true
		const match = scanResult.paths.get("-")
		const isIgnored = match ? match.ignored : false

		expect(isIgnored).toBe(expectedIgnored)
	})

	test('pathmatch case 108: text="a" pattern="[!------]"', async () => {
		const gitignoreContent = "[!------]"
		const allPaths = ["a"]
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

		const expectedIgnored = true
		const match = scanResult.paths.get("a")
		const isIgnored = match ? match.ignored : false

		expect(isIgnored).toBe(expectedIgnored)
	})

	test('pathmatch case 109: text="[" pattern="[]-a]"', async () => {
		const gitignoreContent = "[]-a]"
		const allPaths = ["["]
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

		const expectedIgnored = false
		const match = scanResult.paths.get("[")
		const isIgnored = match ? match.ignored : false

		expect(isIgnored).toBe(expectedIgnored)
	})

	test('pathmatch case 110: text="^" pattern="[]-a]"', async () => {
		const gitignoreContent = "[]-a]"
		const allPaths = ["^"]
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

		const expectedIgnored = true
		const match = scanResult.paths.get("^")
		const isIgnored = match ? match.ignored : false

		expect(isIgnored).toBe(expectedIgnored)
	})

	test('pathmatch case 111: text="^" pattern="[!]-a]"', async () => {
		const gitignoreContent = "[!]-a]"
		const allPaths = ["^"]
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

		const expectedIgnored = false
		const match = scanResult.paths.get("^")
		const isIgnored = match ? match.ignored : false

		expect(isIgnored).toBe(expectedIgnored)
	})

	test('pathmatch case 112: text="[" pattern="[!]-a]"', async () => {
		const gitignoreContent = "[!]-a]"
		const allPaths = ["["]
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

		const expectedIgnored = true
		const match = scanResult.paths.get("[")
		const isIgnored = match ? match.ignored : false

		expect(isIgnored).toBe(expectedIgnored)
	})

	test('pathmatch case 113: text="^" pattern="[a^bc]"', async () => {
		const gitignoreContent = "[a^bc]"
		const allPaths = ["^"]
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

		const expectedIgnored = true
		const match = scanResult.paths.get("^")
		const isIgnored = match ? match.ignored : false

		expect(isIgnored).toBe(expectedIgnored)
	})

	test('pathmatch case 114: text="-b]" pattern="[a-]b]"', async () => {
		const gitignoreContent = "[a-]b]"
		const allPaths = ["-b]"]
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

		const expectedIgnored = true
		const match = scanResult.paths.get("-b]")
		const isIgnored = match ? match.ignored : false

		expect(isIgnored).toBe(expectedIgnored)
	})

	test('pathmatch case 115: text="G" pattern="[A-\\\\]"', async () => {
		const gitignoreContent = "[A-\\\\]"
		const allPaths = ["G"]
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

		const expectedIgnored = true
		const match = scanResult.paths.get("G")
		const isIgnored = match ? match.ignored : false

		expect(isIgnored).toBe(expectedIgnored)
	})

	test('pathmatch case 116: text="aaabbb" pattern="b*a"', async () => {
		const gitignoreContent = "b*a"
		const allPaths = ["aaabbb"]
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

		const expectedIgnored = false
		const match = scanResult.paths.get("aaabbb")
		const isIgnored = match ? match.ignored : false

		expect(isIgnored).toBe(expectedIgnored)
	})

	test('pathmatch case 117: text="aabcaa" pattern="*ba*"', async () => {
		const gitignoreContent = "*ba*"
		const allPaths = ["aabcaa"]
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

		const expectedIgnored = false
		const match = scanResult.paths.get("aabcaa")
		const isIgnored = match ? match.ignored : false

		expect(isIgnored).toBe(expectedIgnored)
	})

	test('pathmatch case 118: text="," pattern="[,]"', async () => {
		const gitignoreContent = "[,]"
		const allPaths = [","]
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

		const expectedIgnored = true
		const match = scanResult.paths.get(",")
		const isIgnored = match ? match.ignored : false

		expect(isIgnored).toBe(expectedIgnored)
	})

	test('pathmatch case 119: text="," pattern="[\\\\,]"', async () => {
		const gitignoreContent = "[\\\\,]"
		const allPaths = [","]
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

		const expectedIgnored = true
		const match = scanResult.paths.get(",")
		const isIgnored = match ? match.ignored : false

		expect(isIgnored).toBe(expectedIgnored)
	})

	test('pathmatch case 120: text="-" pattern="[,-.]"', async () => {
		const gitignoreContent = "[,-.]"
		const allPaths = ["-"]
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

		const expectedIgnored = true
		const match = scanResult.paths.get("-")
		const isIgnored = match ? match.ignored : false

		expect(isIgnored).toBe(expectedIgnored)
	})

	test('pathmatch case 121: text="+" pattern="[,-.]"', async () => {
		const gitignoreContent = "[,-.]"
		const allPaths = ["+"]
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

		const expectedIgnored = false
		const match = scanResult.paths.get("+")
		const isIgnored = match ? match.ignored : false

		expect(isIgnored).toBe(expectedIgnored)
	})

	test('pathmatch case 122: text="-.]" pattern="[,-.]"', async () => {
		const gitignoreContent = "[,-.]"
		const allPaths = ["-.]"]
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

		const expectedIgnored = false
		const match = scanResult.paths.get("-.]")
		const isIgnored = match ? match.ignored : false

		expect(isIgnored).toBe(expectedIgnored)
	})

	test('pathmatch case 123: text="2" pattern="[\\1-\\3]"', async () => {
		const gitignoreContent = "[\\1-\\3]"
		const allPaths = ["2"]
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

		const expectedIgnored = true
		const match = scanResult.paths.get("2")
		const isIgnored = match ? match.ignored : false

		expect(isIgnored).toBe(expectedIgnored)
	})

	test('pathmatch case 124: text="3" pattern="[\\1-\\3]"', async () => {
		const gitignoreContent = "[\\1-\\3]"
		const allPaths = ["3"]
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

		const expectedIgnored = true
		const match = scanResult.paths.get("3")
		const isIgnored = match ? match.ignored : false

		expect(isIgnored).toBe(expectedIgnored)
	})

	test('pathmatch case 125: text="4" pattern="[\\1-\\3]"', async () => {
		const gitignoreContent = "[\\1-\\3]"
		const allPaths = ["4"]
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

		const expectedIgnored = false
		const match = scanResult.paths.get("4")
		const isIgnored = match ? match.ignored : false

		expect(isIgnored).toBe(expectedIgnored)
	})

	test('pathmatch case 126: text="[" pattern="[[-\\]]"', async () => {
		const gitignoreContent = "[[-\\]]"
		const allPaths = ["["]
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

		const expectedIgnored = true
		const match = scanResult.paths.get("[")
		const isIgnored = match ? match.ignored : false

		expect(isIgnored).toBe(expectedIgnored)
	})

	test('pathmatch case 127: text="]" pattern="[[-\\]]"', async () => {
		const gitignoreContent = "[[-\\]]"
		const allPaths = ["]"]
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

		const expectedIgnored = true
		const match = scanResult.paths.get("]")
		const isIgnored = match ? match.ignored : false

		expect(isIgnored).toBe(expectedIgnored)
	})

	test('pathmatch case 128: text="-" pattern="[[-\\]]"', async () => {
		const gitignoreContent = "[[-\\]]"
		const allPaths = ["-"]
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

		const expectedIgnored = false
		const match = scanResult.paths.get("-")
		const isIgnored = match ? match.ignored : false

		expect(isIgnored).toBe(expectedIgnored)
	})

	test('pathmatch case 129: text="-adobe-courier-bold-o-normal--12-120-75-75-m-70-iso8859-1" pattern="-*-*-*-*-*-*-12-*-*-*-m-*-*-*"', async () => {
		const gitignoreContent = "-*-*-*-*-*-*-12-*-*-*-m-*-*-*"
		const allPaths = ["-adobe-courier-bold-o-normal--12-120-75-75-m-70-iso8859-1"]
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

		const expectedIgnored = true
		const match = scanResult.paths.get("-adobe-courier-bold-o-normal--12-120-75-75-m-70-iso8859-1")
		const isIgnored = match ? match.ignored : false

		expect(isIgnored).toBe(expectedIgnored)
	})

	test('pathmatch case 130: text="-adobe-courier-bold-o-normal--12-120-75-75-X-70-iso8859-1" pattern="-*-*-*-*-*-*-12-*-*-*-m-*-*-*"', async () => {
		const gitignoreContent = "-*-*-*-*-*-*-12-*-*-*-m-*-*-*"
		const allPaths = ["-adobe-courier-bold-o-normal--12-120-75-75-X-70-iso8859-1"]
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

		const expectedIgnored = false
		const match = scanResult.paths.get("-adobe-courier-bold-o-normal--12-120-75-75-X-70-iso8859-1")
		const isIgnored = match ? match.ignored : false

		expect(isIgnored).toBe(expectedIgnored)
	})

	test('pathmatch case 131: text="-adobe-courier-bold-o-normal--12-120-75-75-/-70-iso8859-1" pattern="-*-*-*-*-*-*-12-*-*-*-m-*-*-*"', async () => {
		const gitignoreContent = "-*-*-*-*-*-*-12-*-*-*-m-*-*-*"
		const allPaths = ["-adobe-courier-bold-o-normal--12-120-75-75-/-70-iso8859-1"]
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

		const expectedIgnored = false
		const match = scanResult.paths.get("-adobe-courier-bold-o-normal--12-120-75-75-/-70-iso8859-1")
		const isIgnored = match ? match.ignored : false

		expect(isIgnored).toBe(expectedIgnored)
	})

	test('pathmatch case 132: text="XXX/adobe/courier/bold/o/normal//12/120/75/75/m/70/iso8859/1" pattern="XXX/*/*/*/*/*/*/12/*/*/*/m/*/*/*"', async () => {
		const gitignoreContent = "XXX/*/*/*/*/*/*/12/*/*/*/m/*/*/*"
		const allPaths = ["XXX/adobe/courier/bold/o/normal//12/120/75/75/m/70/iso8859/1"]
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

		const expectedIgnored = true
		const match = scanResult.paths.get(
			"XXX/adobe/courier/bold/o/normal//12/120/75/75/m/70/iso8859/1",
		)
		const isIgnored = match ? match.ignored : false

		expect(isIgnored).toBe(expectedIgnored)
	})

	test('pathmatch case 133: text="XXX/adobe/courier/bold/o/normal//12/120/75/75/X/70/iso8859/1" pattern="XXX/*/*/*/*/*/*/12/*/*/*/m/*/*/*"', async () => {
		const gitignoreContent = "XXX/*/*/*/*/*/*/12/*/*/*/m/*/*/*"
		const allPaths = ["XXX/adobe/courier/bold/o/normal//12/120/75/75/X/70/iso8859/1"]
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

		const expectedIgnored = false
		const match = scanResult.paths.get(
			"XXX/adobe/courier/bold/o/normal//12/120/75/75/X/70/iso8859/1",
		)
		const isIgnored = match ? match.ignored : false

		expect(isIgnored).toBe(expectedIgnored)
	})

	test('pathmatch case 134: text="abcd/abcdefg/abcdefghijk/abcdefghijklmnop.txt" pattern="**/*a*b*g*n*t"', async () => {
		const gitignoreContent = "**/*a*b*g*n*t"
		const allPaths = ["abcd/abcdefg/abcdefghijk/abcdefghijklmnop.txt"]
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

		const expectedIgnored = true
		const match = scanResult.paths.get("abcd/abcdefg/abcdefghijk/abcdefghijklmnop.txt")
		const isIgnored = match ? match.ignored : false

		expect(isIgnored).toBe(expectedIgnored)
	})

	test('pathmatch case 135: text="abcd/abcdefg/abcdefghijk/abcdefghijklmnop.txtz" pattern="**/*a*b*g*n*t"', async () => {
		const gitignoreContent = "**/*a*b*g*n*t"
		const allPaths = ["abcd/abcdefg/abcdefghijk/abcdefghijklmnop.txtz"]
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

		const expectedIgnored = false
		const match = scanResult.paths.get("abcd/abcdefg/abcdefghijk/abcdefghijklmnop.txtz")
		const isIgnored = match ? match.ignored : false

		expect(isIgnored).toBe(expectedIgnored)
	})

	test('pathmatch case 136: text="foo" pattern="*/*/*"', async () => {
		const gitignoreContent = "*/*/*"
		const allPaths = ["foo"]
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

		const expectedIgnored = false
		const match = scanResult.paths.get("foo")
		const isIgnored = match ? match.ignored : false

		expect(isIgnored).toBe(expectedIgnored)
	})

	test('pathmatch case 137: text="foo/bar" pattern="*/*/*"', async () => {
		const gitignoreContent = "*/*/*"
		const allPaths = ["foo/bar"]
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

		const expectedIgnored = false
		const match = scanResult.paths.get("foo/bar")
		const isIgnored = match ? match.ignored : false

		expect(isIgnored).toBe(expectedIgnored)
	})

	test('pathmatch case 138: text="foo/bba/arr" pattern="*/*/*"', async () => {
		const gitignoreContent = "*/*/*"
		const allPaths = ["foo/bba/arr"]
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

		const expectedIgnored = true
		const match = scanResult.paths.get("foo/bba/arr")
		const isIgnored = match ? match.ignored : false

		expect(isIgnored).toBe(expectedIgnored)
	})

	test('pathmatch case 139: text="foo/bb/aa/rr" pattern="*/*/*"', async () => {
		const gitignoreContent = "*/*/*"
		const allPaths = ["foo/bb/aa/rr"]
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

		const expectedIgnored = true
		const match = scanResult.paths.get("foo/bb/aa/rr")
		const isIgnored = match ? match.ignored : false

		expect(isIgnored).toBe(expectedIgnored)
	})

	test('pathmatch case 140: text="foo/bb/aa/rr" pattern="**/**/**"', async () => {
		const gitignoreContent = "**/**/**"
		const allPaths = ["foo/bb/aa/rr"]
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

		const expectedIgnored = true
		const match = scanResult.paths.get("foo/bb/aa/rr")
		const isIgnored = match ? match.ignored : false

		expect(isIgnored).toBe(expectedIgnored)
	})

	test('pathmatch case 141: text="abcXdefXghi" pattern="*X*i"', async () => {
		const gitignoreContent = "*X*i"
		const allPaths = ["abcXdefXghi"]
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

		const expectedIgnored = true
		const match = scanResult.paths.get("abcXdefXghi")
		const isIgnored = match ? match.ignored : false

		expect(isIgnored).toBe(expectedIgnored)
	})

	test('pathmatch case 142: text="ab/cXd/efXg/hi" pattern="*X*i"', async () => {
		const gitignoreContent = "*X*i"
		const allPaths = ["ab/cXd/efXg/hi"]
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

		const expectedIgnored = true
		const match = scanResult.paths.get("ab/cXd/efXg/hi")
		const isIgnored = match ? match.ignored : false

		expect(isIgnored).toBe(expectedIgnored)
	})

	test('pathmatch case 143: text="ab/cXd/efXg/hi" pattern="*/*X*/*/*i"', async () => {
		const gitignoreContent = "*/*X*/*/*i"
		const allPaths = ["ab/cXd/efXg/hi"]
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

		const expectedIgnored = true
		const match = scanResult.paths.get("ab/cXd/efXg/hi")
		const isIgnored = match ? match.ignored : false

		expect(isIgnored).toBe(expectedIgnored)
	})

	test('pathmatch case 144: text="ab/cXd/efXg/hi" pattern="**/*X*/**/*i"', async () => {
		const gitignoreContent = "**/*X*/**/*i"
		const allPaths = ["ab/cXd/efXg/hi"]
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

		const expectedIgnored = true
		const match = scanResult.paths.get("ab/cXd/efXg/hi")
		const isIgnored = match ? match.ignored : false

		expect(isIgnored).toBe(expectedIgnored)
	})

	test('pathmatch case 145: text="foo" pattern="fo"', async () => {
		const gitignoreContent = "fo"
		const allPaths = ["foo"]
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

		const expectedIgnored = false
		const match = scanResult.paths.get("foo")
		const isIgnored = match ? match.ignored : false

		expect(isIgnored).toBe(expectedIgnored)
	})

	test('pathmatch case 146: text="foo/bar" pattern="foo/bar"', async () => {
		const gitignoreContent = "foo/bar"
		const allPaths = ["foo/bar"]
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

		const expectedIgnored = true
		const match = scanResult.paths.get("foo/bar")
		const isIgnored = match ? match.ignored : false

		expect(isIgnored).toBe(expectedIgnored)
	})

	test('pathmatch case 147: text="foo/bar" pattern="foo/*"', async () => {
		const gitignoreContent = "foo/*"
		const allPaths = ["foo/bar"]
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

		const expectedIgnored = true
		const match = scanResult.paths.get("foo/bar")
		const isIgnored = match ? match.ignored : false

		expect(isIgnored).toBe(expectedIgnored)
	})

	test('pathmatch case 148: text="foo/bba/arr" pattern="foo/*"', async () => {
		const gitignoreContent = "foo/*"
		const allPaths = ["foo/bba/arr"]
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

		const expectedIgnored = true
		const match = scanResult.paths.get("foo/bba/arr")
		const isIgnored = match ? match.ignored : false

		expect(isIgnored).toBe(expectedIgnored)
	})

	test('pathmatch case 149: text="foo/bba/arr" pattern="foo/**"', async () => {
		const gitignoreContent = "foo/**"
		const allPaths = ["foo/bba/arr"]
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

		const expectedIgnored = true
		const match = scanResult.paths.get("foo/bba/arr")
		const isIgnored = match ? match.ignored : false

		expect(isIgnored).toBe(expectedIgnored)
	})

	test('pathmatch case 150: text="foo/bba/arr" pattern="foo*"', async () => {
		const gitignoreContent = "foo*"
		const allPaths = ["foo/bba/arr"]
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

		const expectedIgnored = true
		const match = scanResult.paths.get("foo/bba/arr")
		const isIgnored = match ? match.ignored : false

		expect(isIgnored).toBe(expectedIgnored)
	})

	test('pathmatch case 151: text="foo/bba/arr" pattern="foo**"', async () => {
		const gitignoreContent = "foo**"
		const allPaths = ["foo/bba/arr"]
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

		const expectedIgnored = true
		const match = scanResult.paths.get("foo/bba/arr")
		const isIgnored = match ? match.ignored : false

		expect(isIgnored).toBe(expectedIgnored)
	})

	test('pathmatch case 152: text="foo/bba/arr" pattern="foo/*arr"', async () => {
		const gitignoreContent = "foo/*arr"
		const allPaths = ["foo/bba/arr"]
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

		const expectedIgnored = true
		const match = scanResult.paths.get("foo/bba/arr")
		const isIgnored = match ? match.ignored : false

		expect(isIgnored).toBe(expectedIgnored)
	})

	test('pathmatch case 153: text="foo/bba/arr" pattern="foo/**arr"', async () => {
		const gitignoreContent = "foo/**arr"
		const allPaths = ["foo/bba/arr"]
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

		const expectedIgnored = true
		const match = scanResult.paths.get("foo/bba/arr")
		const isIgnored = match ? match.ignored : false

		expect(isIgnored).toBe(expectedIgnored)
	})

	test('pathmatch case 154: text="foo/bba/arr" pattern="foo/*z"', async () => {
		const gitignoreContent = "foo/*z"
		const allPaths = ["foo/bba/arr"]
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

		const expectedIgnored = false
		const match = scanResult.paths.get("foo/bba/arr")
		const isIgnored = match ? match.ignored : false

		expect(isIgnored).toBe(expectedIgnored)
	})

	test('pathmatch case 155: text="foo/bba/arr" pattern="foo/**z"', async () => {
		const gitignoreContent = "foo/**z"
		const allPaths = ["foo/bba/arr"]
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

		const expectedIgnored = false
		const match = scanResult.paths.get("foo/bba/arr")
		const isIgnored = match ? match.ignored : false

		expect(isIgnored).toBe(expectedIgnored)
	})

	test('pathmatch case 156: text="foo/bar" pattern="foo?bar"', async () => {
		const gitignoreContent = "foo?bar"
		const allPaths = ["foo/bar"]
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

		const expectedIgnored = true
		const match = scanResult.paths.get("foo/bar")
		const isIgnored = match ? match.ignored : false

		expect(isIgnored).toBe(expectedIgnored)
	})

	test('pathmatch case 157: text="foo/bar" pattern="foo[/]bar"', async () => {
		const gitignoreContent = "foo[/]bar"
		const allPaths = ["foo/bar"]
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

		const expectedIgnored = true
		const match = scanResult.paths.get("foo/bar")
		const isIgnored = match ? match.ignored : false

		expect(isIgnored).toBe(expectedIgnored)
	})

	test('pathmatch case 158: text="foo/bar" pattern="foo[^a-z]bar"', async () => {
		const gitignoreContent = "foo[^a-z]bar"
		const allPaths = ["foo/bar"]
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

		const expectedIgnored = true
		const match = scanResult.paths.get("foo/bar")
		const isIgnored = match ? match.ignored : false

		expect(isIgnored).toBe(expectedIgnored)
	})

	test('pathmatch case 159: text="ab/cXd/efXg/hi" pattern="*Xg*i"', async () => {
		const gitignoreContent = "*Xg*i"
		const allPaths = ["ab/cXd/efXg/hi"]
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

		const expectedIgnored = true
		const match = scanResult.paths.get("ab/cXd/efXg/hi")
		const isIgnored = match ? match.ignored : false

		expect(isIgnored).toBe(expectedIgnored)
	})

	test('pathmatch case 160: text="a" pattern="[A-Z]"', async () => {
		const gitignoreContent = "[A-Z]"
		const allPaths = ["a"]
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

		const expectedIgnored = false
		const match = scanResult.paths.get("a")
		const isIgnored = match ? match.ignored : false

		expect(isIgnored).toBe(expectedIgnored)
	})

	test('pathmatch case 161: text="A" pattern="[A-Z]"', async () => {
		const gitignoreContent = "[A-Z]"
		const allPaths = ["A"]
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

		const expectedIgnored = true
		const match = scanResult.paths.get("A")
		const isIgnored = match ? match.ignored : false

		expect(isIgnored).toBe(expectedIgnored)
	})

	test('pathmatch case 162: text="A" pattern="[a-z]"', async () => {
		const gitignoreContent = "[a-z]"
		const allPaths = ["A"]
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

		const expectedIgnored = false
		const match = scanResult.paths.get("A")
		const isIgnored = match ? match.ignored : false

		expect(isIgnored).toBe(expectedIgnored)
	})

	test('pathmatch case 163: text="a" pattern="[a-z]"', async () => {
		const gitignoreContent = "[a-z]"
		const allPaths = ["a"]
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

		const expectedIgnored = true
		const match = scanResult.paths.get("a")
		const isIgnored = match ? match.ignored : false

		expect(isIgnored).toBe(expectedIgnored)
	})

	test('pathmatch case 164: text="a" pattern="[[:upper:]]"', async () => {
		const gitignoreContent = "[[:upper:]]"
		const allPaths = ["a"]
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

		const expectedIgnored = false
		const match = scanResult.paths.get("a")
		const isIgnored = match ? match.ignored : false

		expect(isIgnored).toBe(expectedIgnored)
	})

	test('pathmatch case 165: text="A" pattern="[[:upper:]]"', async () => {
		const gitignoreContent = "[[:upper:]]"
		const allPaths = ["A"]
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

		const expectedIgnored = true
		const match = scanResult.paths.get("A")
		const isIgnored = match ? match.ignored : false

		expect(isIgnored).toBe(expectedIgnored)
	})

	test('pathmatch case 166: text="A" pattern="[[:lower:]]"', async () => {
		const gitignoreContent = "[[:lower:]]"
		const allPaths = ["A"]
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

		const expectedIgnored = false
		const match = scanResult.paths.get("A")
		const isIgnored = match ? match.ignored : false

		expect(isIgnored).toBe(expectedIgnored)
	})

	test('pathmatch case 167: text="a" pattern="[[:lower:]]"', async () => {
		const gitignoreContent = "[[:lower:]]"
		const allPaths = ["a"]
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

		const expectedIgnored = true
		const match = scanResult.paths.get("a")
		const isIgnored = match ? match.ignored : false

		expect(isIgnored).toBe(expectedIgnored)
	})

	test('pathmatch case 168: text="A" pattern="[B-Za]"', async () => {
		const gitignoreContent = "[B-Za]"
		const allPaths = ["A"]
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

		const expectedIgnored = false
		const match = scanResult.paths.get("A")
		const isIgnored = match ? match.ignored : false

		expect(isIgnored).toBe(expectedIgnored)
	})

	test('pathmatch case 169: text="a" pattern="[B-Za]"', async () => {
		const gitignoreContent = "[B-Za]"
		const allPaths = ["a"]
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

		const expectedIgnored = true
		const match = scanResult.paths.get("a")
		const isIgnored = match ? match.ignored : false

		expect(isIgnored).toBe(expectedIgnored)
	})

	test('pathmatch case 170: text="A" pattern="[B-a]"', async () => {
		const gitignoreContent = "[B-a]"
		const allPaths = ["A"]
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

		const expectedIgnored = false
		const match = scanResult.paths.get("A")
		const isIgnored = match ? match.ignored : false

		expect(isIgnored).toBe(expectedIgnored)
	})

	test('pathmatch case 171: text="a" pattern="[B-a]"', async () => {
		const gitignoreContent = "[B-a]"
		const allPaths = ["a"]
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

		const expectedIgnored = true
		const match = scanResult.paths.get("a")
		const isIgnored = match ? match.ignored : false

		expect(isIgnored).toBe(expectedIgnored)
	})

	test('pathmatch case 172: text="z" pattern="[Z-y]"', async () => {
		const gitignoreContent = "[Z-y]"
		const allPaths = ["z"]
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

		const expectedIgnored = false
		const match = scanResult.paths.get("z")
		const isIgnored = match ? match.ignored : false

		expect(isIgnored).toBe(expectedIgnored)
	})

	test('pathmatch case 173: text="Z" pattern="[Z-y]"', async () => {
		const gitignoreContent = "[Z-y]"
		const allPaths = ["Z"]
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

		const expectedIgnored = true
		const match = scanResult.paths.get("Z")
		const isIgnored = match ? match.ignored : false

		expect(isIgnored).toBe(expectedIgnored)
	})

	test('ipathmatch case 0: text="foo" pattern="foo"', async () => {
		const gitignoreContent = "foo"
		const allPaths = ["foo"]
		const tree = buildTree(allPaths)
		tree[".gitignore"] = gitignoreContent
		tree[".git"] = {
			config: "[core]\n\tignorecase = true",
		}

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

		const expectedIgnored = true
		const match = scanResult.paths.get("foo")
		const isIgnored = match ? match.ignored : false

		expect(isIgnored).toBe(expectedIgnored)
	})

	test('ipathmatch case 1: text="foo" pattern="bar"', async () => {
		const gitignoreContent = "bar"
		const allPaths = ["foo"]
		const tree = buildTree(allPaths)
		tree[".gitignore"] = gitignoreContent
		tree[".git"] = {
			config: "[core]\n\tignorecase = true",
		}

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

		const expectedIgnored = false
		const match = scanResult.paths.get("foo")
		const isIgnored = match ? match.ignored : false

		expect(isIgnored).toBe(expectedIgnored)
	})

	test('ipathmatch case 2: text="foo" pattern="???"', async () => {
		const gitignoreContent = "???"
		const allPaths = ["foo"]
		const tree = buildTree(allPaths)
		tree[".gitignore"] = gitignoreContent
		tree[".git"] = {
			config: "[core]\n\tignorecase = true",
		}

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

		const expectedIgnored = true
		const match = scanResult.paths.get("foo")
		const isIgnored = match ? match.ignored : false

		expect(isIgnored).toBe(expectedIgnored)
	})

	test('ipathmatch case 3: text="foo" pattern="??"', async () => {
		const gitignoreContent = "??"
		const allPaths = ["foo"]
		const tree = buildTree(allPaths)
		tree[".gitignore"] = gitignoreContent
		tree[".git"] = {
			config: "[core]\n\tignorecase = true",
		}

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

		const expectedIgnored = false
		const match = scanResult.paths.get("foo")
		const isIgnored = match ? match.ignored : false

		expect(isIgnored).toBe(expectedIgnored)
	})

	test('ipathmatch case 4: text="foo" pattern="*"', async () => {
		const gitignoreContent = "*"
		const allPaths = ["foo"]
		const tree = buildTree(allPaths)
		tree[".gitignore"] = gitignoreContent
		tree[".git"] = {
			config: "[core]\n\tignorecase = true",
		}

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

		const expectedIgnored = true
		const match = scanResult.paths.get("foo")
		const isIgnored = match ? match.ignored : false

		expect(isIgnored).toBe(expectedIgnored)
	})

	test('ipathmatch case 5: text="foo" pattern="f*"', async () => {
		const gitignoreContent = "f*"
		const allPaths = ["foo"]
		const tree = buildTree(allPaths)
		tree[".gitignore"] = gitignoreContent
		tree[".git"] = {
			config: "[core]\n\tignorecase = true",
		}

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

		const expectedIgnored = true
		const match = scanResult.paths.get("foo")
		const isIgnored = match ? match.ignored : false

		expect(isIgnored).toBe(expectedIgnored)
	})

	test('ipathmatch case 6: text="foo" pattern="*f"', async () => {
		const gitignoreContent = "*f"
		const allPaths = ["foo"]
		const tree = buildTree(allPaths)
		tree[".gitignore"] = gitignoreContent
		tree[".git"] = {
			config: "[core]\n\tignorecase = true",
		}

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

		const expectedIgnored = false
		const match = scanResult.paths.get("foo")
		const isIgnored = match ? match.ignored : false

		expect(isIgnored).toBe(expectedIgnored)
	})

	test('ipathmatch case 7: text="foo" pattern="*foo*"', async () => {
		const gitignoreContent = "*foo*"
		const allPaths = ["foo"]
		const tree = buildTree(allPaths)
		tree[".gitignore"] = gitignoreContent
		tree[".git"] = {
			config: "[core]\n\tignorecase = true",
		}

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

		const expectedIgnored = true
		const match = scanResult.paths.get("foo")
		const isIgnored = match ? match.ignored : false

		expect(isIgnored).toBe(expectedIgnored)
	})

	test('ipathmatch case 8: text="foobar" pattern="*ob*a*r*"', async () => {
		const gitignoreContent = "*ob*a*r*"
		const allPaths = ["foobar"]
		const tree = buildTree(allPaths)
		tree[".gitignore"] = gitignoreContent
		tree[".git"] = {
			config: "[core]\n\tignorecase = true",
		}

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

		const expectedIgnored = true
		const match = scanResult.paths.get("foobar")
		const isIgnored = match ? match.ignored : false

		expect(isIgnored).toBe(expectedIgnored)
	})

	test('ipathmatch case 9: text="aaaaaaabababab" pattern="*ab"', async () => {
		const gitignoreContent = "*ab"
		const allPaths = ["aaaaaaabababab"]
		const tree = buildTree(allPaths)
		tree[".gitignore"] = gitignoreContent
		tree[".git"] = {
			config: "[core]\n\tignorecase = true",
		}

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

		const expectedIgnored = true
		const match = scanResult.paths.get("aaaaaaabababab")
		const isIgnored = match ? match.ignored : false

		expect(isIgnored).toBe(expectedIgnored)
	})

	test('ipathmatch case 10: text="foo*" pattern="foo\\*"', async () => {
		const gitignoreContent = "foo\\*"
		const allPaths = ["foo*"]
		const tree = buildTree(allPaths)
		tree[".gitignore"] = gitignoreContent
		tree[".git"] = {
			config: "[core]\n\tignorecase = true",
		}

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

		const expectedIgnored = true
		const match = scanResult.paths.get("foo*")
		const isIgnored = match ? match.ignored : false

		expect(isIgnored).toBe(expectedIgnored)
	})

	test('ipathmatch case 11: text="foobar" pattern="foo\\*bar"', async () => {
		const gitignoreContent = "foo\\*bar"
		const allPaths = ["foobar"]
		const tree = buildTree(allPaths)
		tree[".gitignore"] = gitignoreContent
		tree[".git"] = {
			config: "[core]\n\tignorecase = true",
		}

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

		const expectedIgnored = false
		const match = scanResult.paths.get("foobar")
		const isIgnored = match ? match.ignored : false

		expect(isIgnored).toBe(expectedIgnored)
	})

	test('ipathmatch case 12: text="ball" pattern="*[al]?"', async () => {
		const gitignoreContent = "*[al]?"
		const allPaths = ["ball"]
		const tree = buildTree(allPaths)
		tree[".gitignore"] = gitignoreContent
		tree[".git"] = {
			config: "[core]\n\tignorecase = true",
		}

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

		const expectedIgnored = true
		const match = scanResult.paths.get("ball")
		const isIgnored = match ? match.ignored : false

		expect(isIgnored).toBe(expectedIgnored)
	})

	test('ipathmatch case 13: text="ten" pattern="[ten]"', async () => {
		const gitignoreContent = "[ten]"
		const allPaths = ["ten"]
		const tree = buildTree(allPaths)
		tree[".gitignore"] = gitignoreContent
		tree[".git"] = {
			config: "[core]\n\tignorecase = true",
		}

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

		const expectedIgnored = false
		const match = scanResult.paths.get("ten")
		const isIgnored = match ? match.ignored : false

		expect(isIgnored).toBe(expectedIgnored)
	})

	test('ipathmatch case 14: text="ten" pattern="**[!te]"', async () => {
		const gitignoreContent = "**[!te]"
		const allPaths = ["ten"]
		const tree = buildTree(allPaths)
		tree[".gitignore"] = gitignoreContent
		tree[".git"] = {
			config: "[core]\n\tignorecase = true",
		}

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

		const expectedIgnored = true
		const match = scanResult.paths.get("ten")
		const isIgnored = match ? match.ignored : false

		expect(isIgnored).toBe(expectedIgnored)
	})

	test('ipathmatch case 15: text="ten" pattern="**[!ten]"', async () => {
		const gitignoreContent = "**[!ten]"
		const allPaths = ["ten"]
		const tree = buildTree(allPaths)
		tree[".gitignore"] = gitignoreContent
		tree[".git"] = {
			config: "[core]\n\tignorecase = true",
		}

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

		const expectedIgnored = false
		const match = scanResult.paths.get("ten")
		const isIgnored = match ? match.ignored : false

		expect(isIgnored).toBe(expectedIgnored)
	})

	test('ipathmatch case 16: text="ten" pattern="t[a-g]n"', async () => {
		const gitignoreContent = "t[a-g]n"
		const allPaths = ["ten"]
		const tree = buildTree(allPaths)
		tree[".gitignore"] = gitignoreContent
		tree[".git"] = {
			config: "[core]\n\tignorecase = true",
		}

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

		const expectedIgnored = true
		const match = scanResult.paths.get("ten")
		const isIgnored = match ? match.ignored : false

		expect(isIgnored).toBe(expectedIgnored)
	})

	test('ipathmatch case 17: text="ten" pattern="t[!a-g]n"', async () => {
		const gitignoreContent = "t[!a-g]n"
		const allPaths = ["ten"]
		const tree = buildTree(allPaths)
		tree[".gitignore"] = gitignoreContent
		tree[".git"] = {
			config: "[core]\n\tignorecase = true",
		}

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

		const expectedIgnored = false
		const match = scanResult.paths.get("ten")
		const isIgnored = match ? match.ignored : false

		expect(isIgnored).toBe(expectedIgnored)
	})

	test('ipathmatch case 18: text="ton" pattern="t[!a-g]n"', async () => {
		const gitignoreContent = "t[!a-g]n"
		const allPaths = ["ton"]
		const tree = buildTree(allPaths)
		tree[".gitignore"] = gitignoreContent
		tree[".git"] = {
			config: "[core]\n\tignorecase = true",
		}

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

		const expectedIgnored = true
		const match = scanResult.paths.get("ton")
		const isIgnored = match ? match.ignored : false

		expect(isIgnored).toBe(expectedIgnored)
	})

	test('ipathmatch case 19: text="ton" pattern="t[^a-g]n"', async () => {
		const gitignoreContent = "t[^a-g]n"
		const allPaths = ["ton"]
		const tree = buildTree(allPaths)
		tree[".gitignore"] = gitignoreContent
		tree[".git"] = {
			config: "[core]\n\tignorecase = true",
		}

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

		const expectedIgnored = true
		const match = scanResult.paths.get("ton")
		const isIgnored = match ? match.ignored : false

		expect(isIgnored).toBe(expectedIgnored)
	})

	test('ipathmatch case 20: text="a]b" pattern="a[]]b"', async () => {
		const gitignoreContent = "a[]]b"
		const allPaths = ["a]b"]
		const tree = buildTree(allPaths)
		tree[".gitignore"] = gitignoreContent
		tree[".git"] = {
			config: "[core]\n\tignorecase = true",
		}

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

		const expectedIgnored = true
		const match = scanResult.paths.get("a]b")
		const isIgnored = match ? match.ignored : false

		expect(isIgnored).toBe(expectedIgnored)
	})

	test('ipathmatch case 21: text="a-b" pattern="a[]-]b"', async () => {
		const gitignoreContent = "a[]-]b"
		const allPaths = ["a-b"]
		const tree = buildTree(allPaths)
		tree[".gitignore"] = gitignoreContent
		tree[".git"] = {
			config: "[core]\n\tignorecase = true",
		}

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

		const expectedIgnored = true
		const match = scanResult.paths.get("a-b")
		const isIgnored = match ? match.ignored : false

		expect(isIgnored).toBe(expectedIgnored)
	})

	test('ipathmatch case 22: text="a]b" pattern="a[]-]b"', async () => {
		const gitignoreContent = "a[]-]b"
		const allPaths = ["a]b"]
		const tree = buildTree(allPaths)
		tree[".gitignore"] = gitignoreContent
		tree[".git"] = {
			config: "[core]\n\tignorecase = true",
		}

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

		const expectedIgnored = true
		const match = scanResult.paths.get("a]b")
		const isIgnored = match ? match.ignored : false

		expect(isIgnored).toBe(expectedIgnored)
	})

	test('ipathmatch case 23: text="aab" pattern="a[]-]b"', async () => {
		const gitignoreContent = "a[]-]b"
		const allPaths = ["aab"]
		const tree = buildTree(allPaths)
		tree[".gitignore"] = gitignoreContent
		tree[".git"] = {
			config: "[core]\n\tignorecase = true",
		}

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

		const expectedIgnored = false
		const match = scanResult.paths.get("aab")
		const isIgnored = match ? match.ignored : false

		expect(isIgnored).toBe(expectedIgnored)
	})

	test('ipathmatch case 24: text="aab" pattern="a[]a-]b"', async () => {
		const gitignoreContent = "a[]a-]b"
		const allPaths = ["aab"]
		const tree = buildTree(allPaths)
		tree[".gitignore"] = gitignoreContent
		tree[".git"] = {
			config: "[core]\n\tignorecase = true",
		}

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

		const expectedIgnored = true
		const match = scanResult.paths.get("aab")
		const isIgnored = match ? match.ignored : false

		expect(isIgnored).toBe(expectedIgnored)
	})

	test('ipathmatch case 25: text="]" pattern="]"', async () => {
		const gitignoreContent = "]"
		const allPaths = ["]"]
		const tree = buildTree(allPaths)
		tree[".gitignore"] = gitignoreContent
		tree[".git"] = {
			config: "[core]\n\tignorecase = true",
		}

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

		const expectedIgnored = true
		const match = scanResult.paths.get("]")
		const isIgnored = match ? match.ignored : false

		expect(isIgnored).toBe(expectedIgnored)
	})

	test('ipathmatch case 26: text="foo/baz/bar" pattern="foo*bar"', async () => {
		const gitignoreContent = "foo*bar"
		const allPaths = ["foo/baz/bar"]
		const tree = buildTree(allPaths)
		tree[".gitignore"] = gitignoreContent
		tree[".git"] = {
			config: "[core]\n\tignorecase = true",
		}

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

		const expectedIgnored = true
		const match = scanResult.paths.get("foo/baz/bar")
		const isIgnored = match ? match.ignored : false

		expect(isIgnored).toBe(expectedIgnored)
	})

	test('ipathmatch case 27: text="foo/baz/bar" pattern="foo**bar"', async () => {
		const gitignoreContent = "foo**bar"
		const allPaths = ["foo/baz/bar"]
		const tree = buildTree(allPaths)
		tree[".gitignore"] = gitignoreContent
		tree[".git"] = {
			config: "[core]\n\tignorecase = true",
		}

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

		const expectedIgnored = true
		const match = scanResult.paths.get("foo/baz/bar")
		const isIgnored = match ? match.ignored : false

		expect(isIgnored).toBe(expectedIgnored)
	})

	test('ipathmatch case 28: text="foobazbar" pattern="foo**bar"', async () => {
		const gitignoreContent = "foo**bar"
		const allPaths = ["foobazbar"]
		const tree = buildTree(allPaths)
		tree[".gitignore"] = gitignoreContent
		tree[".git"] = {
			config: "[core]\n\tignorecase = true",
		}

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

		const expectedIgnored = true
		const match = scanResult.paths.get("foobazbar")
		const isIgnored = match ? match.ignored : false

		expect(isIgnored).toBe(expectedIgnored)
	})

	test('ipathmatch case 29: text="foo/baz/bar" pattern="foo/**/bar"', async () => {
		const gitignoreContent = "foo/**/bar"
		const allPaths = ["foo/baz/bar"]
		const tree = buildTree(allPaths)
		tree[".gitignore"] = gitignoreContent
		tree[".git"] = {
			config: "[core]\n\tignorecase = true",
		}

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

		const expectedIgnored = true
		const match = scanResult.paths.get("foo/baz/bar")
		const isIgnored = match ? match.ignored : false

		expect(isIgnored).toBe(expectedIgnored)
	})

	test('ipathmatch case 30: text="foo/baz/bar" pattern="foo/**/**/bar"', async () => {
		const gitignoreContent = "foo/**/**/bar"
		const allPaths = ["foo/baz/bar"]
		const tree = buildTree(allPaths)
		tree[".gitignore"] = gitignoreContent
		tree[".git"] = {
			config: "[core]\n\tignorecase = true",
		}

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

		const expectedIgnored = false
		const match = scanResult.paths.get("foo/baz/bar")
		const isIgnored = match ? match.ignored : false

		expect(isIgnored).toBe(expectedIgnored)
	})

	test('ipathmatch case 31: text="foo/b/a/z/bar" pattern="foo/**/bar"', async () => {
		const gitignoreContent = "foo/**/bar"
		const allPaths = ["foo/b/a/z/bar"]
		const tree = buildTree(allPaths)
		tree[".gitignore"] = gitignoreContent
		tree[".git"] = {
			config: "[core]\n\tignorecase = true",
		}

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

		const expectedIgnored = true
		const match = scanResult.paths.get("foo/b/a/z/bar")
		const isIgnored = match ? match.ignored : false

		expect(isIgnored).toBe(expectedIgnored)
	})

	test('ipathmatch case 32: text="foo/b/a/z/bar" pattern="foo/**/**/bar"', async () => {
		const gitignoreContent = "foo/**/**/bar"
		const allPaths = ["foo/b/a/z/bar"]
		const tree = buildTree(allPaths)
		tree[".gitignore"] = gitignoreContent
		tree[".git"] = {
			config: "[core]\n\tignorecase = true",
		}

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

		const expectedIgnored = true
		const match = scanResult.paths.get("foo/b/a/z/bar")
		const isIgnored = match ? match.ignored : false

		expect(isIgnored).toBe(expectedIgnored)
	})

	test('ipathmatch case 33: text="foo/bar" pattern="foo/**/bar"', async () => {
		const gitignoreContent = "foo/**/bar"
		const allPaths = ["foo/bar"]
		const tree = buildTree(allPaths)
		tree[".gitignore"] = gitignoreContent
		tree[".git"] = {
			config: "[core]\n\tignorecase = true",
		}

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

		const expectedIgnored = false
		const match = scanResult.paths.get("foo/bar")
		const isIgnored = match ? match.ignored : false

		expect(isIgnored).toBe(expectedIgnored)
	})

	test('ipathmatch case 34: text="foo/bar" pattern="foo/**/**/bar"', async () => {
		const gitignoreContent = "foo/**/**/bar"
		const allPaths = ["foo/bar"]
		const tree = buildTree(allPaths)
		tree[".gitignore"] = gitignoreContent
		tree[".git"] = {
			config: "[core]\n\tignorecase = true",
		}

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

		const expectedIgnored = false
		const match = scanResult.paths.get("foo/bar")
		const isIgnored = match ? match.ignored : false

		expect(isIgnored).toBe(expectedIgnored)
	})

	test('ipathmatch case 35: text="foo/bar" pattern="foo?bar"', async () => {
		const gitignoreContent = "foo?bar"
		const allPaths = ["foo/bar"]
		const tree = buildTree(allPaths)
		tree[".gitignore"] = gitignoreContent
		tree[".git"] = {
			config: "[core]\n\tignorecase = true",
		}

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

		const expectedIgnored = true
		const match = scanResult.paths.get("foo/bar")
		const isIgnored = match ? match.ignored : false

		expect(isIgnored).toBe(expectedIgnored)
	})

	test('ipathmatch case 36: text="foo/bar" pattern="foo[/]bar"', async () => {
		const gitignoreContent = "foo[/]bar"
		const allPaths = ["foo/bar"]
		const tree = buildTree(allPaths)
		tree[".gitignore"] = gitignoreContent
		tree[".git"] = {
			config: "[core]\n\tignorecase = true",
		}

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

		const expectedIgnored = true
		const match = scanResult.paths.get("foo/bar")
		const isIgnored = match ? match.ignored : false

		expect(isIgnored).toBe(expectedIgnored)
	})

	test('ipathmatch case 37: text="foo/bar" pattern="foo[^a-z]bar"', async () => {
		const gitignoreContent = "foo[^a-z]bar"
		const allPaths = ["foo/bar"]
		const tree = buildTree(allPaths)
		tree[".gitignore"] = gitignoreContent
		tree[".git"] = {
			config: "[core]\n\tignorecase = true",
		}

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

		const expectedIgnored = true
		const match = scanResult.paths.get("foo/bar")
		const isIgnored = match ? match.ignored : false

		expect(isIgnored).toBe(expectedIgnored)
	})

	test('ipathmatch case 38: text="foo/bar" pattern="f[^eiu][^eiu][^eiu][^eiu][^eiu]r"', async () => {
		const gitignoreContent = "f[^eiu][^eiu][^eiu][^eiu][^eiu]r"
		const allPaths = ["foo/bar"]
		const tree = buildTree(allPaths)
		tree[".gitignore"] = gitignoreContent
		tree[".git"] = {
			config: "[core]\n\tignorecase = true",
		}

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

		const expectedIgnored = true
		const match = scanResult.paths.get("foo/bar")
		const isIgnored = match ? match.ignored : false

		expect(isIgnored).toBe(expectedIgnored)
	})

	test('ipathmatch case 39: text="foo-bar" pattern="f[^eiu][^eiu][^eiu][^eiu][^eiu]r"', async () => {
		const gitignoreContent = "f[^eiu][^eiu][^eiu][^eiu][^eiu]r"
		const allPaths = ["foo-bar"]
		const tree = buildTree(allPaths)
		tree[".gitignore"] = gitignoreContent
		tree[".git"] = {
			config: "[core]\n\tignorecase = true",
		}

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

		const expectedIgnored = true
		const match = scanResult.paths.get("foo-bar")
		const isIgnored = match ? match.ignored : false

		expect(isIgnored).toBe(expectedIgnored)
	})

	test('ipathmatch case 40: text="foo" pattern="**/foo"', async () => {
		const gitignoreContent = "**/foo"
		const allPaths = ["foo"]
		const tree = buildTree(allPaths)
		tree[".gitignore"] = gitignoreContent
		tree[".git"] = {
			config: "[core]\n\tignorecase = true",
		}

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

		const expectedIgnored = false
		const match = scanResult.paths.get("foo")
		const isIgnored = match ? match.ignored : false

		expect(isIgnored).toBe(expectedIgnored)
	})

	test('ipathmatch case 41: text="XXX/foo" pattern="**/foo"', async () => {
		const gitignoreContent = "**/foo"
		const allPaths = ["XXX/foo"]
		const tree = buildTree(allPaths)
		tree[".gitignore"] = gitignoreContent
		tree[".git"] = {
			config: "[core]\n\tignorecase = true",
		}

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

		const expectedIgnored = true
		const match = scanResult.paths.get("XXX/foo")
		const isIgnored = match ? match.ignored : false

		expect(isIgnored).toBe(expectedIgnored)
	})

	test('ipathmatch case 42: text="bar/baz/foo" pattern="**/foo"', async () => {
		const gitignoreContent = "**/foo"
		const allPaths = ["bar/baz/foo"]
		const tree = buildTree(allPaths)
		tree[".gitignore"] = gitignoreContent
		tree[".git"] = {
			config: "[core]\n\tignorecase = true",
		}

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

		const expectedIgnored = true
		const match = scanResult.paths.get("bar/baz/foo")
		const isIgnored = match ? match.ignored : false

		expect(isIgnored).toBe(expectedIgnored)
	})

	test('ipathmatch case 43: text="bar/baz/foo" pattern="*/foo"', async () => {
		const gitignoreContent = "*/foo"
		const allPaths = ["bar/baz/foo"]
		const tree = buildTree(allPaths)
		tree[".gitignore"] = gitignoreContent
		tree[".git"] = {
			config: "[core]\n\tignorecase = true",
		}

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

		const expectedIgnored = true
		const match = scanResult.paths.get("bar/baz/foo")
		const isIgnored = match ? match.ignored : false

		expect(isIgnored).toBe(expectedIgnored)
	})

	test('ipathmatch case 44: text="foo/bar/baz" pattern="**/bar*"', async () => {
		const gitignoreContent = "**/bar*"
		const allPaths = ["foo/bar/baz"]
		const tree = buildTree(allPaths)
		tree[".gitignore"] = gitignoreContent
		tree[".git"] = {
			config: "[core]\n\tignorecase = true",
		}

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

		const expectedIgnored = true
		const match = scanResult.paths.get("foo/bar/baz")
		const isIgnored = match ? match.ignored : false

		expect(isIgnored).toBe(expectedIgnored)
	})

	test('ipathmatch case 45: text="deep/foo/bar/baz" pattern="**/bar/*"', async () => {
		const gitignoreContent = "**/bar/*"
		const allPaths = ["deep/foo/bar/baz"]
		const tree = buildTree(allPaths)
		tree[".gitignore"] = gitignoreContent
		tree[".git"] = {
			config: "[core]\n\tignorecase = true",
		}

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

		const expectedIgnored = true
		const match = scanResult.paths.get("deep/foo/bar/baz")
		const isIgnored = match ? match.ignored : false

		expect(isIgnored).toBe(expectedIgnored)
	})

	test('ipathmatch case 46: text="deep/foo/bar/baz/" pattern="**/bar/*"', async () => {
		const gitignoreContent = "**/bar/*"
		const allPaths = ["deep/foo/bar/baz/"]
		const tree = buildTree(allPaths)
		tree[".gitignore"] = gitignoreContent
		tree[".git"] = {
			config: "[core]\n\tignorecase = true",
		}

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

		const expectedIgnored = true
		const match = scanResult.paths.get("deep/foo/bar/baz/")
		const isIgnored = match ? match.ignored : false

		expect(isIgnored).toBe(expectedIgnored)
	})

	test('ipathmatch case 47: text="deep/foo/bar/baz/" pattern="**/bar/**"', async () => {
		const gitignoreContent = "**/bar/**"
		const allPaths = ["deep/foo/bar/baz/"]
		const tree = buildTree(allPaths)
		tree[".gitignore"] = gitignoreContent
		tree[".git"] = {
			config: "[core]\n\tignorecase = true",
		}

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

		const expectedIgnored = true
		const match = scanResult.paths.get("deep/foo/bar/baz/")
		const isIgnored = match ? match.ignored : false

		expect(isIgnored).toBe(expectedIgnored)
	})

	test('ipathmatch case 48: text="deep/foo/bar" pattern="**/bar/*"', async () => {
		const gitignoreContent = "**/bar/*"
		const allPaths = ["deep/foo/bar"]
		const tree = buildTree(allPaths)
		tree[".gitignore"] = gitignoreContent
		tree[".git"] = {
			config: "[core]\n\tignorecase = true",
		}

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

		const expectedIgnored = false
		const match = scanResult.paths.get("deep/foo/bar")
		const isIgnored = match ? match.ignored : false

		expect(isIgnored).toBe(expectedIgnored)
	})

	test('ipathmatch case 49: text="deep/foo/bar/" pattern="**/bar/**"', async () => {
		const gitignoreContent = "**/bar/**"
		const allPaths = ["deep/foo/bar/"]
		const tree = buildTree(allPaths)
		tree[".gitignore"] = gitignoreContent
		tree[".git"] = {
			config: "[core]\n\tignorecase = true",
		}

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

		const expectedIgnored = true
		const match = scanResult.paths.get("deep/foo/bar/")
		const isIgnored = match ? match.ignored : false

		expect(isIgnored).toBe(expectedIgnored)
	})

	test('ipathmatch case 50: text="foo/bar/baz" pattern="**/bar**"', async () => {
		const gitignoreContent = "**/bar**"
		const allPaths = ["foo/bar/baz"]
		const tree = buildTree(allPaths)
		tree[".gitignore"] = gitignoreContent
		tree[".git"] = {
			config: "[core]\n\tignorecase = true",
		}

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

		const expectedIgnored = true
		const match = scanResult.paths.get("foo/bar/baz")
		const isIgnored = match ? match.ignored : false

		expect(isIgnored).toBe(expectedIgnored)
	})

	test('ipathmatch case 51: text="foo/bar/baz/x" pattern="*/bar/**"', async () => {
		const gitignoreContent = "*/bar/**"
		const allPaths = ["foo/bar/baz/x"]
		const tree = buildTree(allPaths)
		tree[".gitignore"] = gitignoreContent
		tree[".git"] = {
			config: "[core]\n\tignorecase = true",
		}

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

		const expectedIgnored = true
		const match = scanResult.paths.get("foo/bar/baz/x")
		const isIgnored = match ? match.ignored : false

		expect(isIgnored).toBe(expectedIgnored)
	})

	test('ipathmatch case 52: text="deep/foo/bar/baz/x" pattern="*/bar/**"', async () => {
		const gitignoreContent = "*/bar/**"
		const allPaths = ["deep/foo/bar/baz/x"]
		const tree = buildTree(allPaths)
		tree[".gitignore"] = gitignoreContent
		tree[".git"] = {
			config: "[core]\n\tignorecase = true",
		}

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

		const expectedIgnored = true
		const match = scanResult.paths.get("deep/foo/bar/baz/x")
		const isIgnored = match ? match.ignored : false

		expect(isIgnored).toBe(expectedIgnored)
	})

	test('ipathmatch case 53: text="deep/foo/bar/baz/x" pattern="**/bar/*/*"', async () => {
		const gitignoreContent = "**/bar/*/*"
		const allPaths = ["deep/foo/bar/baz/x"]
		const tree = buildTree(allPaths)
		tree[".gitignore"] = gitignoreContent
		tree[".git"] = {
			config: "[core]\n\tignorecase = true",
		}

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

		const expectedIgnored = true
		const match = scanResult.paths.get("deep/foo/bar/baz/x")
		const isIgnored = match ? match.ignored : false

		expect(isIgnored).toBe(expectedIgnored)
	})

	test('ipathmatch case 54: text="acrt" pattern="a[c-c]st"', async () => {
		const gitignoreContent = "a[c-c]st"
		const allPaths = ["acrt"]
		const tree = buildTree(allPaths)
		tree[".gitignore"] = gitignoreContent
		tree[".git"] = {
			config: "[core]\n\tignorecase = true",
		}

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

		const expectedIgnored = false
		const match = scanResult.paths.get("acrt")
		const isIgnored = match ? match.ignored : false

		expect(isIgnored).toBe(expectedIgnored)
	})

	test('ipathmatch case 55: text="acrt" pattern="a[c-c]rt"', async () => {
		const gitignoreContent = "a[c-c]rt"
		const allPaths = ["acrt"]
		const tree = buildTree(allPaths)
		tree[".gitignore"] = gitignoreContent
		tree[".git"] = {
			config: "[core]\n\tignorecase = true",
		}

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

		const expectedIgnored = true
		const match = scanResult.paths.get("acrt")
		const isIgnored = match ? match.ignored : false

		expect(isIgnored).toBe(expectedIgnored)
	})

	test('ipathmatch case 56: text="]" pattern="[!]-]"', async () => {
		const gitignoreContent = "[!]-]"
		const allPaths = ["]"]
		const tree = buildTree(allPaths)
		tree[".gitignore"] = gitignoreContent
		tree[".git"] = {
			config: "[core]\n\tignorecase = true",
		}

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

		const expectedIgnored = false
		const match = scanResult.paths.get("]")
		const isIgnored = match ? match.ignored : false

		expect(isIgnored).toBe(expectedIgnored)
	})

	test('ipathmatch case 57: text="a" pattern="[!]-]"', async () => {
		const gitignoreContent = "[!]-]"
		const allPaths = ["a"]
		const tree = buildTree(allPaths)
		tree[".gitignore"] = gitignoreContent
		tree[".git"] = {
			config: "[core]\n\tignorecase = true",
		}

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

		const expectedIgnored = true
		const match = scanResult.paths.get("a")
		const isIgnored = match ? match.ignored : false

		expect(isIgnored).toBe(expectedIgnored)
	})

	test('ipathmatch case 58: text="foo" pattern="foo"', async () => {
		const gitignoreContent = "foo"
		const allPaths = ["foo"]
		const tree = buildTree(allPaths)
		tree[".gitignore"] = gitignoreContent
		tree[".git"] = {
			config: "[core]\n\tignorecase = true",
		}

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

		const expectedIgnored = true
		const match = scanResult.paths.get("foo")
		const isIgnored = match ? match.ignored : false

		expect(isIgnored).toBe(expectedIgnored)
	})

	test('ipathmatch case 59: text="@foo" pattern="@foo"', async () => {
		const gitignoreContent = "@foo"
		const allPaths = ["@foo"]
		const tree = buildTree(allPaths)
		tree[".gitignore"] = gitignoreContent
		tree[".git"] = {
			config: "[core]\n\tignorecase = true",
		}

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

		const expectedIgnored = true
		const match = scanResult.paths.get("@foo")
		const isIgnored = match ? match.ignored : false

		expect(isIgnored).toBe(expectedIgnored)
	})

	test('ipathmatch case 60: text="foo" pattern="@foo"', async () => {
		const gitignoreContent = "@foo"
		const allPaths = ["foo"]
		const tree = buildTree(allPaths)
		tree[".gitignore"] = gitignoreContent
		tree[".git"] = {
			config: "[core]\n\tignorecase = true",
		}

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

		const expectedIgnored = false
		const match = scanResult.paths.get("foo")
		const isIgnored = match ? match.ignored : false

		expect(isIgnored).toBe(expectedIgnored)
	})

	test('ipathmatch case 61: text="[ab]" pattern="\\[ab]"', async () => {
		const gitignoreContent = "\\[ab]"
		const allPaths = ["[ab]"]
		const tree = buildTree(allPaths)
		tree[".gitignore"] = gitignoreContent
		tree[".git"] = {
			config: "[core]\n\tignorecase = true",
		}

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

		const expectedIgnored = true
		const match = scanResult.paths.get("[ab]")
		const isIgnored = match ? match.ignored : false

		expect(isIgnored).toBe(expectedIgnored)
	})

	test('ipathmatch case 62: text="[ab]" pattern="[[]ab]"', async () => {
		const gitignoreContent = "[[]ab]"
		const allPaths = ["[ab]"]
		const tree = buildTree(allPaths)
		tree[".gitignore"] = gitignoreContent
		tree[".git"] = {
			config: "[core]\n\tignorecase = true",
		}

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

		const expectedIgnored = true
		const match = scanResult.paths.get("[ab]")
		const isIgnored = match ? match.ignored : false

		expect(isIgnored).toBe(expectedIgnored)
	})

	test('ipathmatch case 63: text="[ab]" pattern="[[:]ab]"', async () => {
		const gitignoreContent = "[[:]ab]"
		const allPaths = ["[ab]"]
		const tree = buildTree(allPaths)
		tree[".gitignore"] = gitignoreContent
		tree[".git"] = {
			config: "[core]\n\tignorecase = true",
		}

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

		const expectedIgnored = true
		const match = scanResult.paths.get("[ab]")
		const isIgnored = match ? match.ignored : false

		expect(isIgnored).toBe(expectedIgnored)
	})

	test('ipathmatch case 64: text="[ab]" pattern="[[::]ab]"', async () => {
		const gitignoreContent = "[[::]ab]"
		const allPaths = ["[ab]"]
		const tree = buildTree(allPaths)
		tree[".gitignore"] = gitignoreContent
		tree[".git"] = {
			config: "[core]\n\tignorecase = true",
		}

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

		const expectedIgnored = false
		const match = scanResult.paths.get("[ab]")
		const isIgnored = match ? match.ignored : false

		expect(isIgnored).toBe(expectedIgnored)
	})

	test('ipathmatch case 65: text="[ab]" pattern="[[:digit]ab]"', async () => {
		const gitignoreContent = "[[:digit]ab]"
		const allPaths = ["[ab]"]
		const tree = buildTree(allPaths)
		tree[".gitignore"] = gitignoreContent
		tree[".git"] = {
			config: "[core]\n\tignorecase = true",
		}

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

		const expectedIgnored = true
		const match = scanResult.paths.get("[ab]")
		const isIgnored = match ? match.ignored : false

		expect(isIgnored).toBe(expectedIgnored)
	})

	test('ipathmatch case 66: text="[ab]" pattern="[\\[:]ab]"', async () => {
		const gitignoreContent = "[\\[:]ab]"
		const allPaths = ["[ab]"]
		const tree = buildTree(allPaths)
		tree[".gitignore"] = gitignoreContent
		tree[".git"] = {
			config: "[core]\n\tignorecase = true",
		}

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

		const expectedIgnored = true
		const match = scanResult.paths.get("[ab]")
		const isIgnored = match ? match.ignored : false

		expect(isIgnored).toBe(expectedIgnored)
	})

	test('ipathmatch case 67: text="?a?b" pattern="\\??\\?b"', async () => {
		const gitignoreContent = "\\??\\?b"
		const allPaths = ["?a?b"]
		const tree = buildTree(allPaths)
		tree[".gitignore"] = gitignoreContent
		tree[".git"] = {
			config: "[core]\n\tignorecase = true",
		}

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

		const expectedIgnored = true
		const match = scanResult.paths.get("?a?b")
		const isIgnored = match ? match.ignored : false

		expect(isIgnored).toBe(expectedIgnored)
	})

	test('ipathmatch case 68: text="abc" pattern="\\a\\b\\c"', async () => {
		const gitignoreContent = "\\a\\b\\c"
		const allPaths = ["abc"]
		const tree = buildTree(allPaths)
		tree[".gitignore"] = gitignoreContent
		tree[".git"] = {
			config: "[core]\n\tignorecase = true",
		}

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

		const expectedIgnored = true
		const match = scanResult.paths.get("abc")
		const isIgnored = match ? match.ignored : false

		expect(isIgnored).toBe(expectedIgnored)
	})

	test('ipathmatch case 70: text="foo/bar/baz/to" pattern="**/t[o]"', async () => {
		const gitignoreContent = "**/t[o]"
		const allPaths = ["foo/bar/baz/to"]
		const tree = buildTree(allPaths)
		tree[".gitignore"] = gitignoreContent
		tree[".git"] = {
			config: "[core]\n\tignorecase = true",
		}

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

		const expectedIgnored = true
		const match = scanResult.paths.get("foo/bar/baz/to")
		const isIgnored = match ? match.ignored : false

		expect(isIgnored).toBe(expectedIgnored)
	})

	test('ipathmatch case 71: text="a1B" pattern="[[:alpha:]][[:digit:]][[:upper:]]"', async () => {
		const gitignoreContent = "[[:alpha:]][[:digit:]][[:upper:]]"
		const allPaths = ["a1B"]
		const tree = buildTree(allPaths)
		tree[".gitignore"] = gitignoreContent
		tree[".git"] = {
			config: "[core]\n\tignorecase = true",
		}

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

		const expectedIgnored = true
		const match = scanResult.paths.get("a1B")
		const isIgnored = match ? match.ignored : false

		expect(isIgnored).toBe(expectedIgnored)
	})

	test('ipathmatch case 72: text="a" pattern="[[:digit:][:upper:][:space:]]"', async () => {
		const gitignoreContent = "[[:digit:][:upper:][:space:]]"
		const allPaths = ["a"]
		const tree = buildTree(allPaths)
		tree[".gitignore"] = gitignoreContent
		tree[".git"] = {
			config: "[core]\n\tignorecase = true",
		}

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

		const expectedIgnored = true
		const match = scanResult.paths.get("a")
		const isIgnored = match ? match.ignored : false

		expect(isIgnored).toBe(expectedIgnored)
	})

	test('ipathmatch case 73: text="A" pattern="[[:digit:][:upper:][:space:]]"', async () => {
		const gitignoreContent = "[[:digit:][:upper:][:space:]]"
		const allPaths = ["A"]
		const tree = buildTree(allPaths)
		tree[".gitignore"] = gitignoreContent
		tree[".git"] = {
			config: "[core]\n\tignorecase = true",
		}

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

		const expectedIgnored = true
		const match = scanResult.paths.get("A")
		const isIgnored = match ? match.ignored : false

		expect(isIgnored).toBe(expectedIgnored)
	})

	test('ipathmatch case 74: text="1" pattern="[[:digit:][:upper:][:space:]]"', async () => {
		const gitignoreContent = "[[:digit:][:upper:][:space:]]"
		const allPaths = ["1"]
		const tree = buildTree(allPaths)
		tree[".gitignore"] = gitignoreContent
		tree[".git"] = {
			config: "[core]\n\tignorecase = true",
		}

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

		const expectedIgnored = true
		const match = scanResult.paths.get("1")
		const isIgnored = match ? match.ignored : false

		expect(isIgnored).toBe(expectedIgnored)
	})

	test('ipathmatch case 75: text="1" pattern="[[:digit:][:upper:][:spaci:]]"', async () => {
		const gitignoreContent = "[[:digit:][:upper:][:spaci:]]"
		const allPaths = ["1"]
		const tree = buildTree(allPaths)
		tree[".gitignore"] = gitignoreContent
		tree[".git"] = {
			config: "[core]\n\tignorecase = true",
		}

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

		const expectedIgnored = false
		const match = scanResult.paths.get("1")
		const isIgnored = match ? match.ignored : false

		expect(isIgnored).toBe(expectedIgnored)
	})

	test('ipathmatch case 76: text=" " pattern="[[:digit:][:upper:][:space:]]"', async () => {
		const gitignoreContent = "[[:digit:][:upper:][:space:]]"
		const allPaths = [" "]
		const tree = buildTree(allPaths)
		tree[".gitignore"] = gitignoreContent
		tree[".git"] = {
			config: "[core]\n\tignorecase = true",
		}

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

		const expectedIgnored = true
		const match = scanResult.paths.get(" ")
		const isIgnored = match ? match.ignored : false

		expect(isIgnored).toBe(expectedIgnored)
	})

	test('ipathmatch case 77: text="5" pattern="[[:xdigit:]]"', async () => {
		const gitignoreContent = "[[:xdigit:]]"
		const allPaths = ["5"]
		const tree = buildTree(allPaths)
		tree[".gitignore"] = gitignoreContent
		tree[".git"] = {
			config: "[core]\n\tignorecase = true",
		}

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

		const expectedIgnored = true
		const match = scanResult.paths.get("5")
		const isIgnored = match ? match.ignored : false

		expect(isIgnored).toBe(expectedIgnored)
	})

	test('ipathmatch case 78: text="f" pattern="[[:xdigit:]]"', async () => {
		const gitignoreContent = "[[:xdigit:]]"
		const allPaths = ["f"]
		const tree = buildTree(allPaths)
		tree[".gitignore"] = gitignoreContent
		tree[".git"] = {
			config: "[core]\n\tignorecase = true",
		}

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

		const expectedIgnored = true
		const match = scanResult.paths.get("f")
		const isIgnored = match ? match.ignored : false

		expect(isIgnored).toBe(expectedIgnored)
	})

	test('ipathmatch case 79: text="D" pattern="[[:xdigit:]]"', async () => {
		const gitignoreContent = "[[:xdigit:]]"
		const allPaths = ["D"]
		const tree = buildTree(allPaths)
		tree[".gitignore"] = gitignoreContent
		tree[".git"] = {
			config: "[core]\n\tignorecase = true",
		}

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

		const expectedIgnored = true
		const match = scanResult.paths.get("D")
		const isIgnored = match ? match.ignored : false

		expect(isIgnored).toBe(expectedIgnored)
	})

	test('ipathmatch case 80: text="_" pattern="[[:alnum:][:alpha:][:blank:][:cntrl:][:digit:][:graph:][:lower:][:print:][:punct:][:space:][:upper:][:xdigit:]]"', async () => {
		const gitignoreContent =
			"[[:alnum:][:alpha:][:blank:][:cntrl:][:digit:][:graph:][:lower:][:print:][:punct:][:space:][:upper:][:xdigit:]]"
		const allPaths = ["_"]
		const tree = buildTree(allPaths)
		tree[".gitignore"] = gitignoreContent
		tree[".git"] = {
			config: "[core]\n\tignorecase = true",
		}

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

		const expectedIgnored = true
		const match = scanResult.paths.get("_")
		const isIgnored = match ? match.ignored : false

		expect(isIgnored).toBe(expectedIgnored)
	})

	test('ipathmatch case 81: text="5" pattern="[a-c[:digit:]x-z]"', async () => {
		const gitignoreContent = "[a-c[:digit:]x-z]"
		const allPaths = ["5"]
		const tree = buildTree(allPaths)
		tree[".gitignore"] = gitignoreContent
		tree[".git"] = {
			config: "[core]\n\tignorecase = true",
		}

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

		const expectedIgnored = true
		const match = scanResult.paths.get("5")
		const isIgnored = match ? match.ignored : false

		expect(isIgnored).toBe(expectedIgnored)
	})

	test('ipathmatch case 82: text="b" pattern="[a-c[:digit:]x-z]"', async () => {
		const gitignoreContent = "[a-c[:digit:]x-z]"
		const allPaths = ["b"]
		const tree = buildTree(allPaths)
		tree[".gitignore"] = gitignoreContent
		tree[".git"] = {
			config: "[core]\n\tignorecase = true",
		}

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

		const expectedIgnored = true
		const match = scanResult.paths.get("b")
		const isIgnored = match ? match.ignored : false

		expect(isIgnored).toBe(expectedIgnored)
	})

	test('ipathmatch case 83: text="y" pattern="[a-c[:digit:]x-z]"', async () => {
		const gitignoreContent = "[a-c[:digit:]x-z]"
		const allPaths = ["y"]
		const tree = buildTree(allPaths)
		tree[".gitignore"] = gitignoreContent
		tree[".git"] = {
			config: "[core]\n\tignorecase = true",
		}

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

		const expectedIgnored = true
		const match = scanResult.paths.get("y")
		const isIgnored = match ? match.ignored : false

		expect(isIgnored).toBe(expectedIgnored)
	})

	test('ipathmatch case 84: text="q" pattern="[a-c[:digit:]x-z]"', async () => {
		const gitignoreContent = "[a-c[:digit:]x-z]"
		const allPaths = ["q"]
		const tree = buildTree(allPaths)
		tree[".gitignore"] = gitignoreContent
		tree[".git"] = {
			config: "[core]\n\tignorecase = true",
		}

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

		const expectedIgnored = false
		const match = scanResult.paths.get("q")
		const isIgnored = match ? match.ignored : false

		expect(isIgnored).toBe(expectedIgnored)
	})

	test('ipathmatch case 85: text="]" pattern="[\\-\\-^]"', async () => {
		const gitignoreContent = "[\\-\\-^]"
		const allPaths = ["]"]
		const tree = buildTree(allPaths)
		tree[".gitignore"] = gitignoreContent
		tree[".git"] = {
			config: "[core]\n\tignorecase = true",
		}

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

		const expectedIgnored = true
		const match = scanResult.paths.get("]")
		const isIgnored = match ? match.ignored : false

		expect(isIgnored).toBe(expectedIgnored)
	})

	test('ipathmatch case 86: text="]" pattern="[\\\\-^]"', async () => {
		const gitignoreContent = "[\\\\-^]"
		const allPaths = ["]"]
		const tree = buildTree(allPaths)
		tree[".gitignore"] = gitignoreContent
		tree[".git"] = {
			config: "[core]\n\tignorecase = true",
		}

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

		const expectedIgnored = true
		const match = scanResult.paths.get("]")
		const isIgnored = match ? match.ignored : false

		expect(isIgnored).toBe(expectedIgnored)
	})

	test('ipathmatch case 87: text="[" pattern="[\\\\-^]"', async () => {
		const gitignoreContent = "[\\\\-^]"
		const allPaths = ["["]
		const tree = buildTree(allPaths)
		tree[".gitignore"] = gitignoreContent
		tree[".git"] = {
			config: "[core]\n\tignorecase = true",
		}

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

		const expectedIgnored = false
		const match = scanResult.paths.get("[")
		const isIgnored = match ? match.ignored : false

		expect(isIgnored).toBe(expectedIgnored)
	})

	test('ipathmatch case 88: text="-" pattern="[\\-_]"', async () => {
		const gitignoreContent = "[\\-_]"
		const allPaths = ["-"]
		const tree = buildTree(allPaths)
		tree[".gitignore"] = gitignoreContent
		tree[".git"] = {
			config: "[core]\n\tignorecase = true",
		}

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

		const expectedIgnored = true
		const match = scanResult.paths.get("-")
		const isIgnored = match ? match.ignored : false

		expect(isIgnored).toBe(expectedIgnored)
	})

	test('ipathmatch case 89: text="]" pattern="[\\]]"', async () => {
		const gitignoreContent = "[\\]]"
		const allPaths = ["]"]
		const tree = buildTree(allPaths)
		tree[".gitignore"] = gitignoreContent
		tree[".git"] = {
			config: "[core]\n\tignorecase = true",
		}

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

		const expectedIgnored = true
		const match = scanResult.paths.get("]")
		const isIgnored = match ? match.ignored : false

		expect(isIgnored).toBe(expectedIgnored)
	})

	test('ipathmatch case 90: text="ab" pattern="a[]b"', async () => {
		const gitignoreContent = "a[]b"
		const allPaths = ["ab"]
		const tree = buildTree(allPaths)
		tree[".gitignore"] = gitignoreContent
		tree[".git"] = {
			config: "[core]\n\tignorecase = true",
		}

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

		const expectedIgnored = false
		const match = scanResult.paths.get("ab")
		const isIgnored = match ? match.ignored : false

		expect(isIgnored).toBe(expectedIgnored)
	})

	test('ipathmatch case 91: text="a[]b" pattern="a[]b"', async () => {
		const gitignoreContent = "a[]b"
		const allPaths = ["a[]b"]
		const tree = buildTree(allPaths)
		tree[".gitignore"] = gitignoreContent
		tree[".git"] = {
			config: "[core]\n\tignorecase = true",
		}

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

		const expectedIgnored = true
		const match = scanResult.paths.get("a[]b")
		const isIgnored = match ? match.ignored : false

		expect(isIgnored).toBe(expectedIgnored)
	})

	test('ipathmatch case 92: text="ab[" pattern="ab["', async () => {
		const gitignoreContent = "ab["
		const allPaths = ["ab["]
		const tree = buildTree(allPaths)
		tree[".gitignore"] = gitignoreContent
		tree[".git"] = {
			config: "[core]\n\tignorecase = true",
		}

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

		const expectedIgnored = true
		const match = scanResult.paths.get("ab[")
		const isIgnored = match ? match.ignored : false

		expect(isIgnored).toBe(expectedIgnored)
	})

	test('ipathmatch case 93: text="ab" pattern="[!"', async () => {
		const gitignoreContent = "[!"
		const allPaths = ["ab"]
		const tree = buildTree(allPaths)
		tree[".gitignore"] = gitignoreContent
		tree[".git"] = {
			config: "[core]\n\tignorecase = true",
		}

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

		const expectedIgnored = false
		const match = scanResult.paths.get("ab")
		const isIgnored = match ? match.ignored : false

		expect(isIgnored).toBe(expectedIgnored)
	})

	test('ipathmatch case 94: text="ab" pattern="[-"', async () => {
		const gitignoreContent = "[-"
		const allPaths = ["ab"]
		const tree = buildTree(allPaths)
		tree[".gitignore"] = gitignoreContent
		tree[".git"] = {
			config: "[core]\n\tignorecase = true",
		}

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

		const expectedIgnored = false
		const match = scanResult.paths.get("ab")
		const isIgnored = match ? match.ignored : false

		expect(isIgnored).toBe(expectedIgnored)
	})

	test('ipathmatch case 95: text="-" pattern="[-]"', async () => {
		const gitignoreContent = "[-]"
		const allPaths = ["-"]
		const tree = buildTree(allPaths)
		tree[".gitignore"] = gitignoreContent
		tree[".git"] = {
			config: "[core]\n\tignorecase = true",
		}

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

		const expectedIgnored = true
		const match = scanResult.paths.get("-")
		const isIgnored = match ? match.ignored : false

		expect(isIgnored).toBe(expectedIgnored)
	})

	test('ipathmatch case 96: text="-" pattern="[a-"', async () => {
		const gitignoreContent = "[a-"
		const allPaths = ["-"]
		const tree = buildTree(allPaths)
		tree[".gitignore"] = gitignoreContent
		tree[".git"] = {
			config: "[core]\n\tignorecase = true",
		}

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

		const expectedIgnored = false
		const match = scanResult.paths.get("-")
		const isIgnored = match ? match.ignored : false

		expect(isIgnored).toBe(expectedIgnored)
	})

	test('ipathmatch case 97: text="-" pattern="[!a-"', async () => {
		const gitignoreContent = "[!a-"
		const allPaths = ["-"]
		const tree = buildTree(allPaths)
		tree[".gitignore"] = gitignoreContent
		tree[".git"] = {
			config: "[core]\n\tignorecase = true",
		}

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

		const expectedIgnored = false
		const match = scanResult.paths.get("-")
		const isIgnored = match ? match.ignored : false

		expect(isIgnored).toBe(expectedIgnored)
	})

	test('ipathmatch case 98: text="-" pattern="[--A]"', async () => {
		const gitignoreContent = "[--A]"
		const allPaths = ["-"]
		const tree = buildTree(allPaths)
		tree[".gitignore"] = gitignoreContent
		tree[".git"] = {
			config: "[core]\n\tignorecase = true",
		}

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

		const expectedIgnored = true
		const match = scanResult.paths.get("-")
		const isIgnored = match ? match.ignored : false

		expect(isIgnored).toBe(expectedIgnored)
	})

	test('ipathmatch case 99: text="5" pattern="[--A]"', async () => {
		const gitignoreContent = "[--A]"
		const allPaths = ["5"]
		const tree = buildTree(allPaths)
		tree[".gitignore"] = gitignoreContent
		tree[".git"] = {
			config: "[core]\n\tignorecase = true",
		}

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

		const expectedIgnored = true
		const match = scanResult.paths.get("5")
		const isIgnored = match ? match.ignored : false

		expect(isIgnored).toBe(expectedIgnored)
	})

	test('ipathmatch case 100: text=" " pattern="[ --]"', async () => {
		const gitignoreContent = "[ --]"
		const allPaths = [" "]
		const tree = buildTree(allPaths)
		tree[".gitignore"] = gitignoreContent
		tree[".git"] = {
			config: "[core]\n\tignorecase = true",
		}

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

		const expectedIgnored = true
		const match = scanResult.paths.get(" ")
		const isIgnored = match ? match.ignored : false

		expect(isIgnored).toBe(expectedIgnored)
	})

	test('ipathmatch case 101: text="$" pattern="[ --]"', async () => {
		const gitignoreContent = "[ --]"
		const allPaths = ["$"]
		const tree = buildTree(allPaths)
		tree[".gitignore"] = gitignoreContent
		tree[".git"] = {
			config: "[core]\n\tignorecase = true",
		}

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

		const expectedIgnored = true
		const match = scanResult.paths.get("$")
		const isIgnored = match ? match.ignored : false

		expect(isIgnored).toBe(expectedIgnored)
	})

	test('ipathmatch case 102: text="-" pattern="[ --]"', async () => {
		const gitignoreContent = "[ --]"
		const allPaths = ["-"]
		const tree = buildTree(allPaths)
		tree[".gitignore"] = gitignoreContent
		tree[".git"] = {
			config: "[core]\n\tignorecase = true",
		}

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

		const expectedIgnored = true
		const match = scanResult.paths.get("-")
		const isIgnored = match ? match.ignored : false

		expect(isIgnored).toBe(expectedIgnored)
	})

	test('ipathmatch case 103: text="0" pattern="[ --]"', async () => {
		const gitignoreContent = "[ --]"
		const allPaths = ["0"]
		const tree = buildTree(allPaths)
		tree[".gitignore"] = gitignoreContent
		tree[".git"] = {
			config: "[core]\n\tignorecase = true",
		}

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

		const expectedIgnored = false
		const match = scanResult.paths.get("0")
		const isIgnored = match ? match.ignored : false

		expect(isIgnored).toBe(expectedIgnored)
	})

	test('ipathmatch case 104: text="-" pattern="[---]"', async () => {
		const gitignoreContent = "[---]"
		const allPaths = ["-"]
		const tree = buildTree(allPaths)
		tree[".gitignore"] = gitignoreContent
		tree[".git"] = {
			config: "[core]\n\tignorecase = true",
		}

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

		const expectedIgnored = true
		const match = scanResult.paths.get("-")
		const isIgnored = match ? match.ignored : false

		expect(isIgnored).toBe(expectedIgnored)
	})

	test('ipathmatch case 105: text="-" pattern="[------]"', async () => {
		const gitignoreContent = "[------]"
		const allPaths = ["-"]
		const tree = buildTree(allPaths)
		tree[".gitignore"] = gitignoreContent
		tree[".git"] = {
			config: "[core]\n\tignorecase = true",
		}

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

		const expectedIgnored = true
		const match = scanResult.paths.get("-")
		const isIgnored = match ? match.ignored : false

		expect(isIgnored).toBe(expectedIgnored)
	})

	test('ipathmatch case 106: text="j" pattern="[a-e-n]"', async () => {
		const gitignoreContent = "[a-e-n]"
		const allPaths = ["j"]
		const tree = buildTree(allPaths)
		tree[".gitignore"] = gitignoreContent
		tree[".git"] = {
			config: "[core]\n\tignorecase = true",
		}

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

		const expectedIgnored = false
		const match = scanResult.paths.get("j")
		const isIgnored = match ? match.ignored : false

		expect(isIgnored).toBe(expectedIgnored)
	})

	test('ipathmatch case 107: text="-" pattern="[a-e-n]"', async () => {
		const gitignoreContent = "[a-e-n]"
		const allPaths = ["-"]
		const tree = buildTree(allPaths)
		tree[".gitignore"] = gitignoreContent
		tree[".git"] = {
			config: "[core]\n\tignorecase = true",
		}

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

		const expectedIgnored = true
		const match = scanResult.paths.get("-")
		const isIgnored = match ? match.ignored : false

		expect(isIgnored).toBe(expectedIgnored)
	})

	test('ipathmatch case 108: text="a" pattern="[!------]"', async () => {
		const gitignoreContent = "[!------]"
		const allPaths = ["a"]
		const tree = buildTree(allPaths)
		tree[".gitignore"] = gitignoreContent
		tree[".git"] = {
			config: "[core]\n\tignorecase = true",
		}

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

		const expectedIgnored = true
		const match = scanResult.paths.get("a")
		const isIgnored = match ? match.ignored : false

		expect(isIgnored).toBe(expectedIgnored)
	})

	test('ipathmatch case 109: text="[" pattern="[]-a]"', async () => {
		const gitignoreContent = "[]-a]"
		const allPaths = ["["]
		const tree = buildTree(allPaths)
		tree[".gitignore"] = gitignoreContent
		tree[".git"] = {
			config: "[core]\n\tignorecase = true",
		}

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

		const expectedIgnored = false
		const match = scanResult.paths.get("[")
		const isIgnored = match ? match.ignored : false

		expect(isIgnored).toBe(expectedIgnored)
	})

	test('ipathmatch case 110: text="^" pattern="[]-a]"', async () => {
		const gitignoreContent = "[]-a]"
		const allPaths = ["^"]
		const tree = buildTree(allPaths)
		tree[".gitignore"] = gitignoreContent
		tree[".git"] = {
			config: "[core]\n\tignorecase = true",
		}

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

		const expectedIgnored = true
		const match = scanResult.paths.get("^")
		const isIgnored = match ? match.ignored : false

		expect(isIgnored).toBe(expectedIgnored)
	})

	test('ipathmatch case 111: text="^" pattern="[!]-a]"', async () => {
		const gitignoreContent = "[!]-a]"
		const allPaths = ["^"]
		const tree = buildTree(allPaths)
		tree[".gitignore"] = gitignoreContent
		tree[".git"] = {
			config: "[core]\n\tignorecase = true",
		}

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

		const expectedIgnored = false
		const match = scanResult.paths.get("^")
		const isIgnored = match ? match.ignored : false

		expect(isIgnored).toBe(expectedIgnored)
	})

	test('ipathmatch case 112: text="[" pattern="[!]-a]"', async () => {
		const gitignoreContent = "[!]-a]"
		const allPaths = ["["]
		const tree = buildTree(allPaths)
		tree[".gitignore"] = gitignoreContent
		tree[".git"] = {
			config: "[core]\n\tignorecase = true",
		}

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

		const expectedIgnored = true
		const match = scanResult.paths.get("[")
		const isIgnored = match ? match.ignored : false

		expect(isIgnored).toBe(expectedIgnored)
	})

	test('ipathmatch case 113: text="^" pattern="[a^bc]"', async () => {
		const gitignoreContent = "[a^bc]"
		const allPaths = ["^"]
		const tree = buildTree(allPaths)
		tree[".gitignore"] = gitignoreContent
		tree[".git"] = {
			config: "[core]\n\tignorecase = true",
		}

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

		const expectedIgnored = true
		const match = scanResult.paths.get("^")
		const isIgnored = match ? match.ignored : false

		expect(isIgnored).toBe(expectedIgnored)
	})

	test('ipathmatch case 114: text="-b]" pattern="[a-]b]"', async () => {
		const gitignoreContent = "[a-]b]"
		const allPaths = ["-b]"]
		const tree = buildTree(allPaths)
		tree[".gitignore"] = gitignoreContent
		tree[".git"] = {
			config: "[core]\n\tignorecase = true",
		}

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

		const expectedIgnored = true
		const match = scanResult.paths.get("-b]")
		const isIgnored = match ? match.ignored : false

		expect(isIgnored).toBe(expectedIgnored)
	})

	test('ipathmatch case 115: text="G" pattern="[A-\\\\]"', async () => {
		const gitignoreContent = "[A-\\\\]"
		const allPaths = ["G"]
		const tree = buildTree(allPaths)
		tree[".gitignore"] = gitignoreContent
		tree[".git"] = {
			config: "[core]\n\tignorecase = true",
		}

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

		const expectedIgnored = true
		const match = scanResult.paths.get("G")
		const isIgnored = match ? match.ignored : false

		expect(isIgnored).toBe(expectedIgnored)
	})

	test('ipathmatch case 116: text="aaabbb" pattern="b*a"', async () => {
		const gitignoreContent = "b*a"
		const allPaths = ["aaabbb"]
		const tree = buildTree(allPaths)
		tree[".gitignore"] = gitignoreContent
		tree[".git"] = {
			config: "[core]\n\tignorecase = true",
		}

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

		const expectedIgnored = false
		const match = scanResult.paths.get("aaabbb")
		const isIgnored = match ? match.ignored : false

		expect(isIgnored).toBe(expectedIgnored)
	})

	test('ipathmatch case 117: text="aabcaa" pattern="*ba*"', async () => {
		const gitignoreContent = "*ba*"
		const allPaths = ["aabcaa"]
		const tree = buildTree(allPaths)
		tree[".gitignore"] = gitignoreContent
		tree[".git"] = {
			config: "[core]\n\tignorecase = true",
		}

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

		const expectedIgnored = false
		const match = scanResult.paths.get("aabcaa")
		const isIgnored = match ? match.ignored : false

		expect(isIgnored).toBe(expectedIgnored)
	})

	test('ipathmatch case 118: text="," pattern="[,]"', async () => {
		const gitignoreContent = "[,]"
		const allPaths = [","]
		const tree = buildTree(allPaths)
		tree[".gitignore"] = gitignoreContent
		tree[".git"] = {
			config: "[core]\n\tignorecase = true",
		}

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

		const expectedIgnored = true
		const match = scanResult.paths.get(",")
		const isIgnored = match ? match.ignored : false

		expect(isIgnored).toBe(expectedIgnored)
	})

	test('ipathmatch case 119: text="," pattern="[\\\\,]"', async () => {
		const gitignoreContent = "[\\\\,]"
		const allPaths = [","]
		const tree = buildTree(allPaths)
		tree[".gitignore"] = gitignoreContent
		tree[".git"] = {
			config: "[core]\n\tignorecase = true",
		}

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

		const expectedIgnored = true
		const match = scanResult.paths.get(",")
		const isIgnored = match ? match.ignored : false

		expect(isIgnored).toBe(expectedIgnored)
	})

	test('ipathmatch case 120: text="-" pattern="[,-.]"', async () => {
		const gitignoreContent = "[,-.]"
		const allPaths = ["-"]
		const tree = buildTree(allPaths)
		tree[".gitignore"] = gitignoreContent
		tree[".git"] = {
			config: "[core]\n\tignorecase = true",
		}

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

		const expectedIgnored = true
		const match = scanResult.paths.get("-")
		const isIgnored = match ? match.ignored : false

		expect(isIgnored).toBe(expectedIgnored)
	})

	test('ipathmatch case 121: text="+" pattern="[,-.]"', async () => {
		const gitignoreContent = "[,-.]"
		const allPaths = ["+"]
		const tree = buildTree(allPaths)
		tree[".gitignore"] = gitignoreContent
		tree[".git"] = {
			config: "[core]\n\tignorecase = true",
		}

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

		const expectedIgnored = false
		const match = scanResult.paths.get("+")
		const isIgnored = match ? match.ignored : false

		expect(isIgnored).toBe(expectedIgnored)
	})

	test('ipathmatch case 122: text="-.]" pattern="[,-.]"', async () => {
		const gitignoreContent = "[,-.]"
		const allPaths = ["-.]"]
		const tree = buildTree(allPaths)
		tree[".gitignore"] = gitignoreContent
		tree[".git"] = {
			config: "[core]\n\tignorecase = true",
		}

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

		const expectedIgnored = false
		const match = scanResult.paths.get("-.]")
		const isIgnored = match ? match.ignored : false

		expect(isIgnored).toBe(expectedIgnored)
	})

	test('ipathmatch case 123: text="2" pattern="[\\1-\\3]"', async () => {
		const gitignoreContent = "[\\1-\\3]"
		const allPaths = ["2"]
		const tree = buildTree(allPaths)
		tree[".gitignore"] = gitignoreContent
		tree[".git"] = {
			config: "[core]\n\tignorecase = true",
		}

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

		const expectedIgnored = true
		const match = scanResult.paths.get("2")
		const isIgnored = match ? match.ignored : false

		expect(isIgnored).toBe(expectedIgnored)
	})

	test('ipathmatch case 124: text="3" pattern="[\\1-\\3]"', async () => {
		const gitignoreContent = "[\\1-\\3]"
		const allPaths = ["3"]
		const tree = buildTree(allPaths)
		tree[".gitignore"] = gitignoreContent
		tree[".git"] = {
			config: "[core]\n\tignorecase = true",
		}

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

		const expectedIgnored = true
		const match = scanResult.paths.get("3")
		const isIgnored = match ? match.ignored : false

		expect(isIgnored).toBe(expectedIgnored)
	})

	test('ipathmatch case 125: text="4" pattern="[\\1-\\3]"', async () => {
		const gitignoreContent = "[\\1-\\3]"
		const allPaths = ["4"]
		const tree = buildTree(allPaths)
		tree[".gitignore"] = gitignoreContent
		tree[".git"] = {
			config: "[core]\n\tignorecase = true",
		}

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

		const expectedIgnored = false
		const match = scanResult.paths.get("4")
		const isIgnored = match ? match.ignored : false

		expect(isIgnored).toBe(expectedIgnored)
	})

	test('ipathmatch case 126: text="[" pattern="[[-\\]]"', async () => {
		const gitignoreContent = "[[-\\]]"
		const allPaths = ["["]
		const tree = buildTree(allPaths)
		tree[".gitignore"] = gitignoreContent
		tree[".git"] = {
			config: "[core]\n\tignorecase = true",
		}

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

		const expectedIgnored = true
		const match = scanResult.paths.get("[")
		const isIgnored = match ? match.ignored : false

		expect(isIgnored).toBe(expectedIgnored)
	})

	test('ipathmatch case 127: text="]" pattern="[[-\\]]"', async () => {
		const gitignoreContent = "[[-\\]]"
		const allPaths = ["]"]
		const tree = buildTree(allPaths)
		tree[".gitignore"] = gitignoreContent
		tree[".git"] = {
			config: "[core]\n\tignorecase = true",
		}

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

		const expectedIgnored = true
		const match = scanResult.paths.get("]")
		const isIgnored = match ? match.ignored : false

		expect(isIgnored).toBe(expectedIgnored)
	})

	test('ipathmatch case 128: text="-" pattern="[[-\\]]"', async () => {
		const gitignoreContent = "[[-\\]]"
		const allPaths = ["-"]
		const tree = buildTree(allPaths)
		tree[".gitignore"] = gitignoreContent
		tree[".git"] = {
			config: "[core]\n\tignorecase = true",
		}

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

		const expectedIgnored = false
		const match = scanResult.paths.get("-")
		const isIgnored = match ? match.ignored : false

		expect(isIgnored).toBe(expectedIgnored)
	})

	test('ipathmatch case 129: text="-adobe-courier-bold-o-normal--12-120-75-75-m-70-iso8859-1" pattern="-*-*-*-*-*-*-12-*-*-*-m-*-*-*"', async () => {
		const gitignoreContent = "-*-*-*-*-*-*-12-*-*-*-m-*-*-*"
		const allPaths = ["-adobe-courier-bold-o-normal--12-120-75-75-m-70-iso8859-1"]
		const tree = buildTree(allPaths)
		tree[".gitignore"] = gitignoreContent
		tree[".git"] = {
			config: "[core]\n\tignorecase = true",
		}

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

		const expectedIgnored = true
		const match = scanResult.paths.get("-adobe-courier-bold-o-normal--12-120-75-75-m-70-iso8859-1")
		const isIgnored = match ? match.ignored : false

		expect(isIgnored).toBe(expectedIgnored)
	})

	test('ipathmatch case 130: text="-adobe-courier-bold-o-normal--12-120-75-75-X-70-iso8859-1" pattern="-*-*-*-*-*-*-12-*-*-*-m-*-*-*"', async () => {
		const gitignoreContent = "-*-*-*-*-*-*-12-*-*-*-m-*-*-*"
		const allPaths = ["-adobe-courier-bold-o-normal--12-120-75-75-X-70-iso8859-1"]
		const tree = buildTree(allPaths)
		tree[".gitignore"] = gitignoreContent
		tree[".git"] = {
			config: "[core]\n\tignorecase = true",
		}

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

		const expectedIgnored = false
		const match = scanResult.paths.get("-adobe-courier-bold-o-normal--12-120-75-75-X-70-iso8859-1")
		const isIgnored = match ? match.ignored : false

		expect(isIgnored).toBe(expectedIgnored)
	})

	test('ipathmatch case 131: text="-adobe-courier-bold-o-normal--12-120-75-75-/-70-iso8859-1" pattern="-*-*-*-*-*-*-12-*-*-*-m-*-*-*"', async () => {
		const gitignoreContent = "-*-*-*-*-*-*-12-*-*-*-m-*-*-*"
		const allPaths = ["-adobe-courier-bold-o-normal--12-120-75-75-/-70-iso8859-1"]
		const tree = buildTree(allPaths)
		tree[".gitignore"] = gitignoreContent
		tree[".git"] = {
			config: "[core]\n\tignorecase = true",
		}

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

		const expectedIgnored = false
		const match = scanResult.paths.get("-adobe-courier-bold-o-normal--12-120-75-75-/-70-iso8859-1")
		const isIgnored = match ? match.ignored : false

		expect(isIgnored).toBe(expectedIgnored)
	})

	test('ipathmatch case 132: text="XXX/adobe/courier/bold/o/normal//12/120/75/75/m/70/iso8859/1" pattern="XXX/*/*/*/*/*/*/12/*/*/*/m/*/*/*"', async () => {
		const gitignoreContent = "XXX/*/*/*/*/*/*/12/*/*/*/m/*/*/*"
		const allPaths = ["XXX/adobe/courier/bold/o/normal//12/120/75/75/m/70/iso8859/1"]
		const tree = buildTree(allPaths)
		tree[".gitignore"] = gitignoreContent
		tree[".git"] = {
			config: "[core]\n\tignorecase = true",
		}

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

		const expectedIgnored = true
		const match = scanResult.paths.get(
			"XXX/adobe/courier/bold/o/normal//12/120/75/75/m/70/iso8859/1",
		)
		const isIgnored = match ? match.ignored : false

		expect(isIgnored).toBe(expectedIgnored)
	})

	test('ipathmatch case 133: text="XXX/adobe/courier/bold/o/normal//12/120/75/75/X/70/iso8859/1" pattern="XXX/*/*/*/*/*/*/12/*/*/*/m/*/*/*"', async () => {
		const gitignoreContent = "XXX/*/*/*/*/*/*/12/*/*/*/m/*/*/*"
		const allPaths = ["XXX/adobe/courier/bold/o/normal//12/120/75/75/X/70/iso8859/1"]
		const tree = buildTree(allPaths)
		tree[".gitignore"] = gitignoreContent
		tree[".git"] = {
			config: "[core]\n\tignorecase = true",
		}

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

		const expectedIgnored = false
		const match = scanResult.paths.get(
			"XXX/adobe/courier/bold/o/normal//12/120/75/75/X/70/iso8859/1",
		)
		const isIgnored = match ? match.ignored : false

		expect(isIgnored).toBe(expectedIgnored)
	})

	test('ipathmatch case 134: text="abcd/abcdefg/abcdefghijk/abcdefghijklmnop.txt" pattern="**/*a*b*g*n*t"', async () => {
		const gitignoreContent = "**/*a*b*g*n*t"
		const allPaths = ["abcd/abcdefg/abcdefghijk/abcdefghijklmnop.txt"]
		const tree = buildTree(allPaths)
		tree[".gitignore"] = gitignoreContent
		tree[".git"] = {
			config: "[core]\n\tignorecase = true",
		}

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

		const expectedIgnored = true
		const match = scanResult.paths.get("abcd/abcdefg/abcdefghijk/abcdefghijklmnop.txt")
		const isIgnored = match ? match.ignored : false

		expect(isIgnored).toBe(expectedIgnored)
	})

	test('ipathmatch case 135: text="abcd/abcdefg/abcdefghijk/abcdefghijklmnop.txtz" pattern="**/*a*b*g*n*t"', async () => {
		const gitignoreContent = "**/*a*b*g*n*t"
		const allPaths = ["abcd/abcdefg/abcdefghijk/abcdefghijklmnop.txtz"]
		const tree = buildTree(allPaths)
		tree[".gitignore"] = gitignoreContent
		tree[".git"] = {
			config: "[core]\n\tignorecase = true",
		}

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

		const expectedIgnored = false
		const match = scanResult.paths.get("abcd/abcdefg/abcdefghijk/abcdefghijklmnop.txtz")
		const isIgnored = match ? match.ignored : false

		expect(isIgnored).toBe(expectedIgnored)
	})

	test('ipathmatch case 136: text="foo" pattern="*/*/*"', async () => {
		const gitignoreContent = "*/*/*"
		const allPaths = ["foo"]
		const tree = buildTree(allPaths)
		tree[".gitignore"] = gitignoreContent
		tree[".git"] = {
			config: "[core]\n\tignorecase = true",
		}

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

		const expectedIgnored = false
		const match = scanResult.paths.get("foo")
		const isIgnored = match ? match.ignored : false

		expect(isIgnored).toBe(expectedIgnored)
	})

	test('ipathmatch case 137: text="foo/bar" pattern="*/*/*"', async () => {
		const gitignoreContent = "*/*/*"
		const allPaths = ["foo/bar"]
		const tree = buildTree(allPaths)
		tree[".gitignore"] = gitignoreContent
		tree[".git"] = {
			config: "[core]\n\tignorecase = true",
		}

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

		const expectedIgnored = false
		const match = scanResult.paths.get("foo/bar")
		const isIgnored = match ? match.ignored : false

		expect(isIgnored).toBe(expectedIgnored)
	})

	test('ipathmatch case 138: text="foo/bba/arr" pattern="*/*/*"', async () => {
		const gitignoreContent = "*/*/*"
		const allPaths = ["foo/bba/arr"]
		const tree = buildTree(allPaths)
		tree[".gitignore"] = gitignoreContent
		tree[".git"] = {
			config: "[core]\n\tignorecase = true",
		}

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

		const expectedIgnored = true
		const match = scanResult.paths.get("foo/bba/arr")
		const isIgnored = match ? match.ignored : false

		expect(isIgnored).toBe(expectedIgnored)
	})

	test('ipathmatch case 139: text="foo/bb/aa/rr" pattern="*/*/*"', async () => {
		const gitignoreContent = "*/*/*"
		const allPaths = ["foo/bb/aa/rr"]
		const tree = buildTree(allPaths)
		tree[".gitignore"] = gitignoreContent
		tree[".git"] = {
			config: "[core]\n\tignorecase = true",
		}

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

		const expectedIgnored = true
		const match = scanResult.paths.get("foo/bb/aa/rr")
		const isIgnored = match ? match.ignored : false

		expect(isIgnored).toBe(expectedIgnored)
	})

	test('ipathmatch case 140: text="foo/bb/aa/rr" pattern="**/**/**"', async () => {
		const gitignoreContent = "**/**/**"
		const allPaths = ["foo/bb/aa/rr"]
		const tree = buildTree(allPaths)
		tree[".gitignore"] = gitignoreContent
		tree[".git"] = {
			config: "[core]\n\tignorecase = true",
		}

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

		const expectedIgnored = true
		const match = scanResult.paths.get("foo/bb/aa/rr")
		const isIgnored = match ? match.ignored : false

		expect(isIgnored).toBe(expectedIgnored)
	})

	test('ipathmatch case 141: text="abcXdefXghi" pattern="*X*i"', async () => {
		const gitignoreContent = "*X*i"
		const allPaths = ["abcXdefXghi"]
		const tree = buildTree(allPaths)
		tree[".gitignore"] = gitignoreContent
		tree[".git"] = {
			config: "[core]\n\tignorecase = true",
		}

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

		const expectedIgnored = true
		const match = scanResult.paths.get("abcXdefXghi")
		const isIgnored = match ? match.ignored : false

		expect(isIgnored).toBe(expectedIgnored)
	})

	test('ipathmatch case 142: text="ab/cXd/efXg/hi" pattern="*X*i"', async () => {
		const gitignoreContent = "*X*i"
		const allPaths = ["ab/cXd/efXg/hi"]
		const tree = buildTree(allPaths)
		tree[".gitignore"] = gitignoreContent
		tree[".git"] = {
			config: "[core]\n\tignorecase = true",
		}

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

		const expectedIgnored = true
		const match = scanResult.paths.get("ab/cXd/efXg/hi")
		const isIgnored = match ? match.ignored : false

		expect(isIgnored).toBe(expectedIgnored)
	})

	test('ipathmatch case 143: text="ab/cXd/efXg/hi" pattern="*/*X*/*/*i"', async () => {
		const gitignoreContent = "*/*X*/*/*i"
		const allPaths = ["ab/cXd/efXg/hi"]
		const tree = buildTree(allPaths)
		tree[".gitignore"] = gitignoreContent
		tree[".git"] = {
			config: "[core]\n\tignorecase = true",
		}

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

		const expectedIgnored = true
		const match = scanResult.paths.get("ab/cXd/efXg/hi")
		const isIgnored = match ? match.ignored : false

		expect(isIgnored).toBe(expectedIgnored)
	})

	test('ipathmatch case 144: text="ab/cXd/efXg/hi" pattern="**/*X*/**/*i"', async () => {
		const gitignoreContent = "**/*X*/**/*i"
		const allPaths = ["ab/cXd/efXg/hi"]
		const tree = buildTree(allPaths)
		tree[".gitignore"] = gitignoreContent
		tree[".git"] = {
			config: "[core]\n\tignorecase = true",
		}

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

		const expectedIgnored = true
		const match = scanResult.paths.get("ab/cXd/efXg/hi")
		const isIgnored = match ? match.ignored : false

		expect(isIgnored).toBe(expectedIgnored)
	})

	test('ipathmatch case 145: text="foo" pattern="fo"', async () => {
		const gitignoreContent = "fo"
		const allPaths = ["foo"]
		const tree = buildTree(allPaths)
		tree[".gitignore"] = gitignoreContent
		tree[".git"] = {
			config: "[core]\n\tignorecase = true",
		}

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

		const expectedIgnored = false
		const match = scanResult.paths.get("foo")
		const isIgnored = match ? match.ignored : false

		expect(isIgnored).toBe(expectedIgnored)
	})

	test('ipathmatch case 146: text="foo/bar" pattern="foo/bar"', async () => {
		const gitignoreContent = "foo/bar"
		const allPaths = ["foo/bar"]
		const tree = buildTree(allPaths)
		tree[".gitignore"] = gitignoreContent
		tree[".git"] = {
			config: "[core]\n\tignorecase = true",
		}

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

		const expectedIgnored = true
		const match = scanResult.paths.get("foo/bar")
		const isIgnored = match ? match.ignored : false

		expect(isIgnored).toBe(expectedIgnored)
	})

	test('ipathmatch case 147: text="foo/bar" pattern="foo/*"', async () => {
		const gitignoreContent = "foo/*"
		const allPaths = ["foo/bar"]
		const tree = buildTree(allPaths)
		tree[".gitignore"] = gitignoreContent
		tree[".git"] = {
			config: "[core]\n\tignorecase = true",
		}

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

		const expectedIgnored = true
		const match = scanResult.paths.get("foo/bar")
		const isIgnored = match ? match.ignored : false

		expect(isIgnored).toBe(expectedIgnored)
	})

	test('ipathmatch case 148: text="foo/bba/arr" pattern="foo/*"', async () => {
		const gitignoreContent = "foo/*"
		const allPaths = ["foo/bba/arr"]
		const tree = buildTree(allPaths)
		tree[".gitignore"] = gitignoreContent
		tree[".git"] = {
			config: "[core]\n\tignorecase = true",
		}

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

		const expectedIgnored = true
		const match = scanResult.paths.get("foo/bba/arr")
		const isIgnored = match ? match.ignored : false

		expect(isIgnored).toBe(expectedIgnored)
	})

	test('ipathmatch case 149: text="foo/bba/arr" pattern="foo/**"', async () => {
		const gitignoreContent = "foo/**"
		const allPaths = ["foo/bba/arr"]
		const tree = buildTree(allPaths)
		tree[".gitignore"] = gitignoreContent
		tree[".git"] = {
			config: "[core]\n\tignorecase = true",
		}

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

		const expectedIgnored = true
		const match = scanResult.paths.get("foo/bba/arr")
		const isIgnored = match ? match.ignored : false

		expect(isIgnored).toBe(expectedIgnored)
	})

	test('ipathmatch case 150: text="foo/bba/arr" pattern="foo*"', async () => {
		const gitignoreContent = "foo*"
		const allPaths = ["foo/bba/arr"]
		const tree = buildTree(allPaths)
		tree[".gitignore"] = gitignoreContent
		tree[".git"] = {
			config: "[core]\n\tignorecase = true",
		}

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

		const expectedIgnored = true
		const match = scanResult.paths.get("foo/bba/arr")
		const isIgnored = match ? match.ignored : false

		expect(isIgnored).toBe(expectedIgnored)
	})

	test('ipathmatch case 151: text="foo/bba/arr" pattern="foo**"', async () => {
		const gitignoreContent = "foo**"
		const allPaths = ["foo/bba/arr"]
		const tree = buildTree(allPaths)
		tree[".gitignore"] = gitignoreContent
		tree[".git"] = {
			config: "[core]\n\tignorecase = true",
		}

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

		const expectedIgnored = true
		const match = scanResult.paths.get("foo/bba/arr")
		const isIgnored = match ? match.ignored : false

		expect(isIgnored).toBe(expectedIgnored)
	})

	test('ipathmatch case 152: text="foo/bba/arr" pattern="foo/*arr"', async () => {
		const gitignoreContent = "foo/*arr"
		const allPaths = ["foo/bba/arr"]
		const tree = buildTree(allPaths)
		tree[".gitignore"] = gitignoreContent
		tree[".git"] = {
			config: "[core]\n\tignorecase = true",
		}

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

		const expectedIgnored = true
		const match = scanResult.paths.get("foo/bba/arr")
		const isIgnored = match ? match.ignored : false

		expect(isIgnored).toBe(expectedIgnored)
	})

	test('ipathmatch case 153: text="foo/bba/arr" pattern="foo/**arr"', async () => {
		const gitignoreContent = "foo/**arr"
		const allPaths = ["foo/bba/arr"]
		const tree = buildTree(allPaths)
		tree[".gitignore"] = gitignoreContent
		tree[".git"] = {
			config: "[core]\n\tignorecase = true",
		}

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

		const expectedIgnored = true
		const match = scanResult.paths.get("foo/bba/arr")
		const isIgnored = match ? match.ignored : false

		expect(isIgnored).toBe(expectedIgnored)
	})

	test('ipathmatch case 154: text="foo/bba/arr" pattern="foo/*z"', async () => {
		const gitignoreContent = "foo/*z"
		const allPaths = ["foo/bba/arr"]
		const tree = buildTree(allPaths)
		tree[".gitignore"] = gitignoreContent
		tree[".git"] = {
			config: "[core]\n\tignorecase = true",
		}

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

		const expectedIgnored = false
		const match = scanResult.paths.get("foo/bba/arr")
		const isIgnored = match ? match.ignored : false

		expect(isIgnored).toBe(expectedIgnored)
	})

	test('ipathmatch case 155: text="foo/bba/arr" pattern="foo/**z"', async () => {
		const gitignoreContent = "foo/**z"
		const allPaths = ["foo/bba/arr"]
		const tree = buildTree(allPaths)
		tree[".gitignore"] = gitignoreContent
		tree[".git"] = {
			config: "[core]\n\tignorecase = true",
		}

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

		const expectedIgnored = false
		const match = scanResult.paths.get("foo/bba/arr")
		const isIgnored = match ? match.ignored : false

		expect(isIgnored).toBe(expectedIgnored)
	})

	test('ipathmatch case 156: text="foo/bar" pattern="foo?bar"', async () => {
		const gitignoreContent = "foo?bar"
		const allPaths = ["foo/bar"]
		const tree = buildTree(allPaths)
		tree[".gitignore"] = gitignoreContent
		tree[".git"] = {
			config: "[core]\n\tignorecase = true",
		}

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

		const expectedIgnored = true
		const match = scanResult.paths.get("foo/bar")
		const isIgnored = match ? match.ignored : false

		expect(isIgnored).toBe(expectedIgnored)
	})

	test('ipathmatch case 157: text="foo/bar" pattern="foo[/]bar"', async () => {
		const gitignoreContent = "foo[/]bar"
		const allPaths = ["foo/bar"]
		const tree = buildTree(allPaths)
		tree[".gitignore"] = gitignoreContent
		tree[".git"] = {
			config: "[core]\n\tignorecase = true",
		}

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

		const expectedIgnored = true
		const match = scanResult.paths.get("foo/bar")
		const isIgnored = match ? match.ignored : false

		expect(isIgnored).toBe(expectedIgnored)
	})

	test('ipathmatch case 158: text="foo/bar" pattern="foo[^a-z]bar"', async () => {
		const gitignoreContent = "foo[^a-z]bar"
		const allPaths = ["foo/bar"]
		const tree = buildTree(allPaths)
		tree[".gitignore"] = gitignoreContent
		tree[".git"] = {
			config: "[core]\n\tignorecase = true",
		}

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

		const expectedIgnored = true
		const match = scanResult.paths.get("foo/bar")
		const isIgnored = match ? match.ignored : false

		expect(isIgnored).toBe(expectedIgnored)
	})

	test('ipathmatch case 159: text="ab/cXd/efXg/hi" pattern="*Xg*i"', async () => {
		const gitignoreContent = "*Xg*i"
		const allPaths = ["ab/cXd/efXg/hi"]
		const tree = buildTree(allPaths)
		tree[".gitignore"] = gitignoreContent
		tree[".git"] = {
			config: "[core]\n\tignorecase = true",
		}

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

		const expectedIgnored = true
		const match = scanResult.paths.get("ab/cXd/efXg/hi")
		const isIgnored = match ? match.ignored : false

		expect(isIgnored).toBe(expectedIgnored)
	})

	test('ipathmatch case 160: text="a" pattern="[A-Z]"', async () => {
		const gitignoreContent = "[A-Z]"
		const allPaths = ["a"]
		const tree = buildTree(allPaths)
		tree[".gitignore"] = gitignoreContent
		tree[".git"] = {
			config: "[core]\n\tignorecase = true",
		}

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

		const expectedIgnored = true
		const match = scanResult.paths.get("a")
		const isIgnored = match ? match.ignored : false

		expect(isIgnored).toBe(expectedIgnored)
	})

	test('ipathmatch case 161: text="A" pattern="[A-Z]"', async () => {
		const gitignoreContent = "[A-Z]"
		const allPaths = ["A"]
		const tree = buildTree(allPaths)
		tree[".gitignore"] = gitignoreContent
		tree[".git"] = {
			config: "[core]\n\tignorecase = true",
		}

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

		const expectedIgnored = true
		const match = scanResult.paths.get("A")
		const isIgnored = match ? match.ignored : false

		expect(isIgnored).toBe(expectedIgnored)
	})

	test('ipathmatch case 162: text="A" pattern="[a-z]"', async () => {
		const gitignoreContent = "[a-z]"
		const allPaths = ["A"]
		const tree = buildTree(allPaths)
		tree[".gitignore"] = gitignoreContent
		tree[".git"] = {
			config: "[core]\n\tignorecase = true",
		}

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

		const expectedIgnored = true
		const match = scanResult.paths.get("A")
		const isIgnored = match ? match.ignored : false

		expect(isIgnored).toBe(expectedIgnored)
	})

	test('ipathmatch case 163: text="a" pattern="[a-z]"', async () => {
		const gitignoreContent = "[a-z]"
		const allPaths = ["a"]
		const tree = buildTree(allPaths)
		tree[".gitignore"] = gitignoreContent
		tree[".git"] = {
			config: "[core]\n\tignorecase = true",
		}

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

		const expectedIgnored = true
		const match = scanResult.paths.get("a")
		const isIgnored = match ? match.ignored : false

		expect(isIgnored).toBe(expectedIgnored)
	})

	test('ipathmatch case 164: text="a" pattern="[[:upper:]]"', async () => {
		const gitignoreContent = "[[:upper:]]"
		const allPaths = ["a"]
		const tree = buildTree(allPaths)
		tree[".gitignore"] = gitignoreContent
		tree[".git"] = {
			config: "[core]\n\tignorecase = true",
		}

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

		const expectedIgnored = true
		const match = scanResult.paths.get("a")
		const isIgnored = match ? match.ignored : false

		expect(isIgnored).toBe(expectedIgnored)
	})

	test('ipathmatch case 165: text="A" pattern="[[:upper:]]"', async () => {
		const gitignoreContent = "[[:upper:]]"
		const allPaths = ["A"]
		const tree = buildTree(allPaths)
		tree[".gitignore"] = gitignoreContent
		tree[".git"] = {
			config: "[core]\n\tignorecase = true",
		}

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

		const expectedIgnored = true
		const match = scanResult.paths.get("A")
		const isIgnored = match ? match.ignored : false

		expect(isIgnored).toBe(expectedIgnored)
	})

	test('ipathmatch case 166: text="A" pattern="[[:lower:]]"', async () => {
		const gitignoreContent = "[[:lower:]]"
		const allPaths = ["A"]
		const tree = buildTree(allPaths)
		tree[".gitignore"] = gitignoreContent
		tree[".git"] = {
			config: "[core]\n\tignorecase = true",
		}

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

		const expectedIgnored = true
		const match = scanResult.paths.get("A")
		const isIgnored = match ? match.ignored : false

		expect(isIgnored).toBe(expectedIgnored)
	})

	test('ipathmatch case 167: text="a" pattern="[[:lower:]]"', async () => {
		const gitignoreContent = "[[:lower:]]"
		const allPaths = ["a"]
		const tree = buildTree(allPaths)
		tree[".gitignore"] = gitignoreContent
		tree[".git"] = {
			config: "[core]\n\tignorecase = true",
		}

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

		const expectedIgnored = true
		const match = scanResult.paths.get("a")
		const isIgnored = match ? match.ignored : false

		expect(isIgnored).toBe(expectedIgnored)
	})

	test('ipathmatch case 168: text="A" pattern="[B-Za]"', async () => {
		const gitignoreContent = "[B-Za]"
		const allPaths = ["A"]
		const tree = buildTree(allPaths)
		tree[".gitignore"] = gitignoreContent
		tree[".git"] = {
			config: "[core]\n\tignorecase = true",
		}

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

		const expectedIgnored = true
		const match = scanResult.paths.get("A")
		const isIgnored = match ? match.ignored : false

		expect(isIgnored).toBe(expectedIgnored)
	})

	test('ipathmatch case 169: text="a" pattern="[B-Za]"', async () => {
		const gitignoreContent = "[B-Za]"
		const allPaths = ["a"]
		const tree = buildTree(allPaths)
		tree[".gitignore"] = gitignoreContent
		tree[".git"] = {
			config: "[core]\n\tignorecase = true",
		}

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

		const expectedIgnored = true
		const match = scanResult.paths.get("a")
		const isIgnored = match ? match.ignored : false

		expect(isIgnored).toBe(expectedIgnored)
	})

	test('ipathmatch case 170: text="A" pattern="[B-a]"', async () => {
		const gitignoreContent = "[B-a]"
		const allPaths = ["A"]
		const tree = buildTree(allPaths)
		tree[".gitignore"] = gitignoreContent
		tree[".git"] = {
			config: "[core]\n\tignorecase = true",
		}

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

		const expectedIgnored = true
		const match = scanResult.paths.get("A")
		const isIgnored = match ? match.ignored : false

		expect(isIgnored).toBe(expectedIgnored)
	})

	test('ipathmatch case 171: text="a" pattern="[B-a]"', async () => {
		const gitignoreContent = "[B-a]"
		const allPaths = ["a"]
		const tree = buildTree(allPaths)
		tree[".gitignore"] = gitignoreContent
		tree[".git"] = {
			config: "[core]\n\tignorecase = true",
		}

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

		const expectedIgnored = true
		const match = scanResult.paths.get("a")
		const isIgnored = match ? match.ignored : false

		expect(isIgnored).toBe(expectedIgnored)
	})

	test('ipathmatch case 172: text="z" pattern="[Z-y]"', async () => {
		const gitignoreContent = "[Z-y]"
		const allPaths = ["z"]
		const tree = buildTree(allPaths)
		tree[".gitignore"] = gitignoreContent
		tree[".git"] = {
			config: "[core]\n\tignorecase = true",
		}

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

		const expectedIgnored = true
		const match = scanResult.paths.get("z")
		const isIgnored = match ? match.ignored : false

		expect(isIgnored).toBe(expectedIgnored)
	})

	test('ipathmatch case 173: text="Z" pattern="[Z-y]"', async () => {
		const gitignoreContent = "[Z-y]"
		const allPaths = ["Z"]
		const tree = buildTree(allPaths)
		tree[".gitignore"] = gitignoreContent
		tree[".git"] = {
			config: "[core]\n\tignorecase = true",
		}

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

		const expectedIgnored = true
		const match = scanResult.paths.get("Z")
		const isIgnored = match ? match.ignored : false

		expect(isIgnored).toBe(expectedIgnored)
	})
})
