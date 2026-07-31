import type { EventMap } from "./patterns/matcherStreamTypes.js"

import { describe, test, expect } from "bun:test"
import { Volume } from "memfs"
import * as process from "node:process"

import { RuleMatchKind } from "./patterns/rule.js"
import { scanStream } from "./stream.js"
import { makeGit } from "./targets/git.js"
import { testStream, createAdapter } from "./testScan.test.js"

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

describe("Stream - AsyncIterable", () => {
	test("standard complete async iteration yielding EntryInfo objects", async () => {
		const tree = {
			"file1.txt": "1",
			"file2.txt": "2",
		}
		const cwd = process.cwd() + "/test-async-iter"
		const vol = Volume.fromNestedJSON(tree, cwd)
		const adapter = createAdapter(vol)
		const o = { cwd, fs: adapter, target: makeGit() }

		const stream = scanStream(o)
		const paths: string[] = []
		let endCtxSeen = false

		for await (const event of stream) {
			if (event.type === "dirent") {
				const direntEvent = event as EventMap["dirent"]
				paths.push(direntEvent.detail.path)
				expect(direntEvent.detail).toHaveProperty("dirent")
				expect(direntEvent.detail).toHaveProperty("match")
			} else if (event.type === "end") {
				endCtxSeen = true
				const endEvent = event as EventMap["end"]
				expect(endEvent.detail).toHaveProperty("paths")
			}
		}

		expect(paths.sort()).toEqual(["file1.txt", "file2.txt"].sort())
		expect(endCtxSeen).toBe(true)
	})

	test("early termination of the loop cleans up the event listeners", async () => {
		const tree = {
			"file1.txt": "1",
			"file2.txt": "2",
			"file3.txt": "3",
		}
		const cwd = process.cwd() + "/test-early-term"
		const vol = Volume.fromNestedJSON(tree, cwd)
		const adapter = createAdapter(vol)
		const o = { cwd, fs: adapter, target: makeGit() }

		const stream = scanStream(o)

		let adds = 0
		let removes = 0
		const originalAdd = stream.addEventListener.bind(stream)
		const originalRemove = stream.removeEventListener.bind(stream)

		stream.addEventListener = (type, cb, options) => {
			adds++
			return originalAdd(type, cb, options)
		}
		stream.removeEventListener = (type, cb, options) => {
			removes++
			return originalRemove(type, cb, options)
		}

		// Iterate and break early
		for await (const event of stream) {
			if (event.type === "dirent") {
				const direntEvent = event as EventMap["dirent"]
				const path = direntEvent.detail.path
				if (path === "file1.txt" || path === "file2.txt" || path === "file3.txt") {
					break
				}
			}
		}

		// Ensure listeners were added and then subsequently cleaned up
		expect(adds).toBeGreaterThan(0)
		expect(removes).toBe(adds)
	})

	test("errors during stream generation are properly thrown by the iterator", async () => {
		const cwd = process.cwd() + "/test-async-err"
		const badFs = {
			// oxlint-disable-next-line typescript/no-explicit-any
			readFile: (_path: any, cb: any) => {
				cb(null, Buffer.from(""))
			},
			// oxlint-disable-next-line typescript/no-explicit-any
			readdir: (_path: any, _options: any, cb: any) => {
				cb(new Error("Readdir failure simulation"))
			},
			// oxlint-disable-next-line typescript/no-explicit-any
			stat: (_path: any, cb: any) => {
				cb(null, {})
			},
		}
		// oxlint-disable-next-line typescript/no-explicit-any
		const o = { cwd, fs: badFs as any, target: makeGit() }

		const stream = scanStream(o)
		let thrownError: Error | null = null

		try {
			for await (const _ of stream) {
				// empty
			}
		} catch (err) {
			thrownError = err as Error
		}

		expect(thrownError).not.toBeNull()
		expect(thrownError!.message).toBe("Readdir failure simulation")
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
