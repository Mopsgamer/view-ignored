import type { FsAdapter } from "../types.js"

import { expect, test } from "bun:test"

import { parseGit, getIncludes, loadRec, resolvePath, mergeConfig } from "./gitConfig.js"

test("Implicit Boolean Keys", () => {
	const config = `[core]
	bare
	filemode = true`
	const parsed = parseGit(config)
	expect(parsed.core.bare).toBe(true)
	expect(parsed.core.filemode).toBe("true")
})

test("Include Ordering Discrepancy", () => {
	const config = `[include]
	path = first.config
[includeIf "gitdir:foo/"]
	path = second.config
[include]
	path = third.config`
	const parsed = parseGit(config)

	const includes = getIncludes(parsed, "foo/bar", null)
	expect(includes).toEqual(["first.config", "second.config", "third.config"])
})

test("Cache Bypass with gitDir", (done) => {
	let readCount = 0
	const fs = <FsAdapter>{
		readFile: (_path: string, cb: (err: Error | null, res?: Buffer) => void) => {
			readCount++
			cb(null, Buffer.from("[core]\n\tbare = true"))
		},
		// oxlint-disable-next-line typescript/no-explicit-any
		stat: null as any,
	}

	loadRec(fs, "/config", "gitdir", null, null, (_res1) => {
		expect(readCount).toBe(1)
		loadRec(fs, "/config", "gitdir", null, null, (_res2) => {
			expect(readCount).toBe(1)
			done()
		})
	})
})

test("Case Sensitivity in hasConfig", () => {
	const config = `[remote "Origin"]
	url = foo`
	const parsed = parseGit(config)

	expect(getIncludes(parsed, "gitdir", null)).toEqual([])

	expect(parsed['remote "Origin"']).toBeDefined()
	expect(parsed['remote "origin"']).toBeUndefined()

	const withIncludeIf = {
		...parsed,
		__order: [...(parsed.__order || []), 'includeif "hasconfig:remote.Origin.url":0'],
		'includeif "hasconfig:remote.Origin.url"': { path: ["found"] },
	}

	expect(getIncludes(withIncludeIf, "gitdir", null)).toEqual(["found"])

	const withIncludeIfLower = {
		...parsed,
		__order: [...(parsed.__order || []), 'includeif "hasconfig:remote.origin.url":0'],
		'includeif "hasconfig:remote.origin.url"': { path: ["found"] },
	}

	expect(getIncludes(withIncludeIfLower, "gitdir", null)).toEqual([])
})

test("resolvePath with absolute and drive paths", () => {
	expect(resolvePath("/base", "/abs/path")).toBe("/abs/path")
	expect(resolvePath("/base", "C:/win/path")).toBe("C:/win/path")
	expect(resolvePath("/base", "./rel/path")).toBe("/base/rel/path")
})

test("mergeConfig and parseGit edge cases", () => {
	// oxlint-disable-next-line typescript/no-explicit-any
	const targetObj: any = { a: 1, nested: { b: 2 } }
	mergeConfig(targetObj, { nested: { c: 3 }, override: 4 })
	expect(targetObj).toEqual({ a: 1, nested: { b: 2, c: 3 }, override: 4 })

	const gitText = `[section "sub"]
	path = foo.config
	key = val
[include]
	path = inc.config`

	const parsed = parseGit(gitText)
	expect(parsed['section "sub"'].key).toBe("val")
	expect(parsed.include.path).toEqual(["inc.config"])
})

test("getIncludes with hasconfig and conditional includes", () => {
	const gitText = `[includeif "hasconfig:remote.origin.url=https://github.com/test/repo"]
	path = conditional.config
[includeif "hasconfig:invalidkey"]
	path = invalid.config
[includeif "hasconfig:remote.origin.pushurl"]
	path = push.config`

	const parsed = parseGit(gitText)
	parsed['remote "origin"'] = { pushurl: ["push1"], url: "https://github.com/test/repo" }

	const includes = getIncludes(parsed, "/git/dir", "main")
	expect(includes).toContain("conditional.config")
	expect(includes).toContain("push.config")
	expect(includes).not.toContain("invalid.config")
})

test("loadRec with abort signal and cached results", (done) => {
	const controller = new AbortController()
	controller.abort()

	// oxlint-disable-next-line typescript/no-explicit-any
	loadRec({} as FsAdapter, "config", null, null, controller.signal, (res) => {
		expect(res).toBeNull()
	})

	// oxlint-disable-next-line typescript/no-explicit-any
	const mockFs: any = {
		// oxlint-disable-next-line typescript/no-explicit-any
		readFile: (p: string, cb: any) => {
			if (p === "/root/.gitconfig") {
				cb(null, Buffer.from("[include]\n\tpath = sub.config"))
			} else if (p === "/root/sub.config") {
				cb(null, Buffer.from("[user]\n\tname = Test"))
			} else {
				cb(new Error("ENOENT"))
			}
		},
	}

	loadRec(mockFs, "/root/.gitconfig", null, null, null, (res1) => {
		expect(res1.user.name).toBe("Test")

		loadRec(mockFs, "/root/.gitconfig", null, null, null, (res2) => {
			expect(res2.user.name).toBe("Test")
			done()
		})
	})
})
