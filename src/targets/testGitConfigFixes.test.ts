import type { FsAdapter } from "../types.js"

import { expect, test } from "bun:test"

import { parseGit, getIncludes, loadRec } from "./gitConfig.js"

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
