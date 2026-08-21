import { describe, test, expect } from "bun:test"

import { RuleMatchKind, type SkipRule } from "./patterns/rule.js"
import { scanParallel } from "./scanParallel.js"
import { makeGit } from "./targets/git.js"
import { makeNPM } from "./targets/npm.js"
import { testStream } from "./testScan.test.js"
import { type FsAdapter } from "./types.js"
import { walkIncludes, walkPatchResult } from "./walk.js"

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

describe("scanParallel and walk edge cases", () => {
	test("scanParallel with empty withinList", (done) => {
		scanParallel(
			{
				external: new Map(),
				scanOptions: {
					cwd: ".",
					depth: 10,
					dirs: false,
					// oxlint-disable-next-line typescript/no-explicit-any
					fs: {} as FsAdapter,
					invert: false,
					// oxlint-disable-next-line typescript/no-explicit-any
					signal: null as any,
					skipDepth: false,
					skipInternal: false,
					target: makeNPM(),
					within: [],
				},
			},
			(err, results) => {
				expect(err).toBeNull()
				expect(results).toEqual([])
				done()
			},
		)
	})

	test("scanParallel stat error on file item in within", (done) => {
		// oxlint-disable-next-line typescript/no-explicit-any
		const mockFs: any = {
			// oxlint-disable-next-line typescript/no-explicit-any
			stat: (_p: string, cb: any) => cb(new Error("Stat failed")),
		}

		scanParallel(
			{
				external: new Map(),
				scanOptions: {
					cwd: ".",
					depth: 10,
					dirs: false,
					fs: mockFs,
					invert: false,
					// oxlint-disable-next-line typescript/no-explicit-any
					signal: null as any,
					skipDepth: false,
					skipInternal: false,
					target: makeNPM(),
					within: "somefile.js",
				},
			},
			(err, results) => {
				expect(err).toBeInstanceOf(Error)
				expect(err?.message).toBe("Stat failed")
				expect(results).toBeNull()
				done()
			},
		)
	})

	test("scanParallel processSingleFile with error resource and no failed array", (done) => {
		// oxlint-disable-next-line typescript/no-explicit-any
		const mockFs: any = {
			// oxlint-disable-next-line typescript/no-explicit-any
			readFile: (_p: string, cb: any) => {
				cb(new Error("FS Read Error"))
			},
			// oxlint-disable-next-line typescript/no-explicit-any
			stat: (_p: string, cb: any) => {
				cb(null, {
					isDirectory: () => false,
					isFile: () => true,
					isSymbolicLink: () => false,
				})
			},
		}

		scanParallel(
			{
				external: new Map(),
				scanOptions: {
					cwd: "/test",
					depth: 10,
					dirs: false,
					fs: mockFs,
					invert: false,
					// oxlint-disable-next-line typescript/no-explicit-any
					signal: null as any,
					skipDepth: false,
					skipInternal: false,
					// oxlint-disable-next-line typescript/no-explicit-any
					target: { extractors: [{ extract: () => {}, path: ".gitignore" }], root: "." } as any,
					within: "single.js",
				},
			},
			(err, results) => {
				expect(err).toBeInstanceOf(Error)
				expect(err?.message).toBe("FS Read Error")
				expect(results).toBeNull()
				done()
			},
		)
	})

	test("walkIncludes async skip rule rejection triggers error callback", async () => {
		const rejectingSkipRule: SkipRule = () => {
			return Promise.reject(new Error("Async skip rule rejected"))
		}

		// oxlint-disable-next-line typescript/no-explicit-any
		const mockTarget: any = {
			internalRules: [rejectingSkipRule],
		}

		// oxlint-disable-next-line typescript/no-explicit-any
		const options: any = {
			depth: 1,
			entry: { isDirectory: () => true, isFile: () => false, name: "subdir" },
			lowerEntry: "subdir",
			parentPath: ".",
			relPath: "subdir",
			resource: null,
			scanOptions: {
				cwd: ".",
				depth: 10,
				dirs: false,
				// oxlint-disable-next-line typescript/no-explicit-any
				fs: {} as FsAdapter,
				invert: false,
				signal: null,
				skipDepth: false,
				skipInternal: false,
				target: mockTarget,
			},
			stream: undefined,
		}

		let caughtError: Error | null = null
		try {
			await walkIncludes(options)
		} catch (err) {
			caughtError = err as Error
		}
		expect(caughtError).not.toBeNull()
		expect(caughtError?.message).toBe("Async skip rule rejected")
	})

	test("walkPatchResult dirent patching for trailing slash path", () => {
		// oxlint-disable-next-line typescript/no-explicit-any
		let dispatchedEvent: any = null
		// oxlint-disable-next-line typescript/no-explicit-any
		const mockStream: any = {
			// oxlint-disable-next-line typescript/no-explicit-any
			dispatchEvent: (ev: any) => {
				dispatchedEvent = ev
			},
		}

		// oxlint-disable-next-line typescript/no-explicit-any
		const mockCtx: any = {
			external: new Map(),
			failed: [],
			paths: new Map(),
			total: new Map(),
		}

		// oxlint-disable-next-line typescript/no-explicit-any
		const result: any = {
			context: undefined,
			depth: 1,
			entry: { isDirectory: () => false, isFile: () => true, name: "foo" },
			includeParent: false,
			isDir: false,
			match: { ignored: false, kind: 0 },
			next: 1,
			parentPath: "dir",
			path: "dir/foo/",
			tooDeep: false,
		}

		// oxlint-disable-next-line typescript/no-explicit-any
		const options: any = {
			dirs: true,
			invert: false,
		}

		walkPatchResult(mockCtx, result, options, mockStream)
		expect(dispatchedEvent).not.toBeNull()
		expect(dispatchedEvent.detail.path).toBe("dir/foo/")
		expect(dispatchedEvent.detail.dirent.isDirectory()).toBeTrue()
	})
})
