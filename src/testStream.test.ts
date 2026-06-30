import { describe, test, expect } from "bun:test"

import { RuleMatchKind } from "./patterns/rule.js"
import { makeGit } from "./targets/git.js"
import { testStream } from "./testScan.test.js"

describe("Git", () => {
	test("scanStream no file", async (done) => {
		await testStream(
			{ file: "1", src: { file: "2" } },
			({ stream }) => {
				const paths: { kind: number; path: string }[] = []
				stream.addEventListener("dirent", ({ detail: d }) => {
					paths.push({ kind: d.match.kind, path: d.path })
				})
				stream.addEventListener(
					"end",
					() => {
						expect(paths.sort((a, b) => a.path.localeCompare(b.path))).toMatchObject(
							[
								{ kind: RuleMatchKind.missingSource, path: "file" },
								{ kind: RuleMatchKind.missingSource, path: "src/" },
								{ kind: RuleMatchKind.missingSource, path: "src/file" },
							].sort((a, b) => a.path.localeCompare(b.path)),
						)
						done()
					},
					{ once: true },
				)
			},
			{ invert: 2, target: makeGit() },
		)
	})
	test("scanStream .gitignore", async (done) => {
		await testStream(
			{ ".git": { HEAD: "" }, ".gitignore": "file", file: "1", src: { file: "2" } },
			({ stream }) => {
				const paths: { kind: number; path: string }[] = []
				stream.addEventListener("dirent", ({ detail: d }) => {
					paths.push({ kind: d.match.kind, path: d.path })
				})
				stream.addEventListener(
					"end",
					() => {
						expect(paths.sort((a, b) => a.path.localeCompare(b.path))).toMatchObject(
							[
								{ kind: RuleMatchKind.external, path: "file" },
								{ kind: RuleMatchKind.noMatch, path: "src/" },
								{ kind: RuleMatchKind.external, path: "src/file" },
								{ kind: RuleMatchKind.noMatch, path: ".gitignore" },
								{ kind: RuleMatchKind.internal, path: ".git/" },
								{ kind: RuleMatchKind.internal, path: ".git/HEAD" },
							].sort((a, b) => a.path.localeCompare(b.path)),
						)
						done()
					},
					{ once: true },
				)
			},
			{ invert: 2, target: makeGit() },
		)
	})
})

describe("Stream Stability - Unique Directories", () => {
	test("Deeply nested directories should emit each directory only once", async () => {
		const tree = {
			a: {
				b: {
					c: {
						"file.txt": "content",
					},
				},
			},
		}
		await testStream(
			tree,
			({ stream }) => {
				const paths: string[] = []
				stream.addEventListener("dirent", ({ detail: d }) => {
					paths.push(d.path)
				})
				stream.addEventListener("end", () => {
					const expected = ["a/", "a/b/", "a/b/c/", "a/b/c/file.txt"].sort()
					expect(paths.sort()).toEqual(expected)

					// Check for duplicates
					const uniquePaths = new Set(paths)
					expect(uniquePaths.size).toBe(paths.length)
				})
			},
			{ dirs: true, target: makeGit() },
		)
	})

	test("Scanning from a subdirectory should emit that subdirectory as root only once if applicable", async () => {
		const tree = {
			subdir: {
				"file.txt": "content",
				nested: {
					"inner.txt": "content",
				},
			},
		}
		await testStream(
			tree,
			({ stream }) => {
				const paths: string[] = []
				stream.addEventListener("dirent", ({ detail: d }) => {
					paths.push(d.path)
				})
				stream.addEventListener("end", () => {
					const expected = [
						"subdir/",
						"subdir/file.txt",
						"subdir/nested/",
						"subdir/nested/inner.txt",
					].sort()
					expect(paths.sort()).toEqual(expected)

					const uniquePaths = new Set(paths)
					expect(uniquePaths.size).toBe(paths.length)
				})
			},
			{ dirs: true, target: makeGit(), within: "subdir" },
		)
	})

	test("Multiple files in same directory should not cause multiple directory emissions", async () => {
		const tree = {
			dir: {
				"file1.txt": "1",
				"file2.txt": "2",
				"file3.txt": "3",
			},
		}
		await testStream(
			tree,
			({ stream }) => {
				const paths: string[] = []
				stream.addEventListener("dirent", ({ detail: d }) => {
					paths.push(d.path)
				})
				stream.addEventListener("end", () => {
					const expected = ["dir/", "dir/file1.txt", "dir/file2.txt", "dir/file3.txt"].sort()
					expect(paths.sort()).toEqual(expected)

					const dirEmissions = paths.filter((p) => p === "dir/")
					expect(dirEmissions.length).toBe(1)
				})
			},
			{ dirs: true, target: makeGit() },
		)
	})

	test("Invert options stability", async () => {
		const tree = {
			".gitignore": "ignored/",
			ignored: {
				"file.txt": "content",
			},
			"included.txt": "content",
		}

		// invert: 2 (All files)
		await testStream(
			tree,
			({ stream }) => {
				const paths: string[] = []
				stream.addEventListener("dirent", ({ detail: d }) => {
					paths.push(d.path)
				})
				stream.addEventListener("end", () => {
					const expected = [".gitignore", "ignored/", "ignored/file.txt", "included.txt"].sort()
					expect(paths.sort()).toEqual(expected)
					expect(new Set(paths).size).toBe(paths.length)
				})
			},
			{ dirs: true, invert: 2, target: makeGit() },
		)
	})
})
