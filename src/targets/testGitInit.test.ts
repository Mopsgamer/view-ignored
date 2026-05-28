import type { NestedDirectoryJSON } from "memfs"

import type { PathHandlerOptions } from "../testScan.test.js"

import { describe, test } from "bun:test"
import * as process from "node:process"

import { testScan } from "../testScan.test.js"
import { Git } from "./git.js"

async function testGit(
	done: () => void,
	tree: NestedDirectoryJSON,
	handler: ((o: PathHandlerOptions) => void | Promise<void>) | string[],
) {
	try {
		const target = { ...Git, internalRules: [...Git.internalRules] }
		await testScan(done, tree, handler, { target })
	} catch (error) {
		throw new Error("Error while testing Git", { cause: error })
	}
}

describe("Git Init", () => {
	const HOME = (process.env.HOME || process.env.USERPROFILE || "").replaceAll("\\", "/")

	test("reads core.excludesFile from .git/config", async (done) => {
		await testGit(
			done,
			{
				".git": {
					config: "[core]\nexcludesfile = my-ignore",
					"my-ignore": "ignored-file",
				},
				"ignored-file": "",
				"other-file": "",
			},
			["other-file"],
		)
	})

	test("reads core.excludesFile from HOME/.gitconfig", async (done) => {
		const tree: NestedDirectoryJSON = {}
		tree[HOME + "/.gitconfig"] = "[core]\nexcludesfile = " + HOME + "/global-ignore"
		tree[HOME + "/global-ignore"] = "global-ignored"
		tree["local-file"] = ""
		tree["global-ignored"] = ""

		await testGit(done, tree, ["local-file"])
	})

	test("supports [include] in git config", async (done) => {
		await testGit(
			done,
			{
				".git": {
					config: "[include]\npath = extra-config",
					"extra-config": "[core]\nexcludesfile = my-ignore",
					"my-ignore": "ignored-by-include",
				},
				"ignored-by-include": "",
				"kept-file": "",
			},
			["kept-file"],
		)
	})

	test("supports [includeIf] in git config", async (done) => {
		const cwd = process.cwd() + "/test"
		await testGit(
			done,
			{
				".git": {
					config: '[includeIf "gitdir:' + cwd + '/"]\npath = extra-config',
					"extra-config": "[core]\nexcludesfile = my-ignore",
					"my-ignore": "ignored-by-conditional",
				},
				"ignored-by-conditional": "",
				"kept-file": "",
			},
			["kept-file"],
		)
	})

	test("handles multiple [include] paths (last one wins for core.excludesFile)", async (done) => {
		await testGit(
			done,
			{
				".git": {
					config: "[include]\npath = config1\npath = config2",
					config1: "[core]\nexcludesfile = ignore1",
					config2: "[core]\nexcludesfile = ignore2",
					ignore1: "file1",
					ignore2: "file2",
				},
				file1: "",
				file2: "",
				file3: "",
			},
			["file1", "file3"],
		)
	})

	test('supports [includeIf "onbranch:..."]', async (done) => {
		await testGit(
			done,
			{
				".git": {
					HEAD: "ref: refs/heads/main\n",
					config: '[includeIf "onbranch:main"]\npath = main-config',
					"main-config": "[core]\nexcludesfile = main-ignore",
					"main-ignore": "only-on-main",
				},
				"only-on-main": "",
				"other-file": "",
			},
			["other-file"],
		)
	})

	test('supports [includeIf "hasconfig:..."]', async (done) => {
		await testGit(
			done,
			{
				".git": {
					config:
						'[user]\nname = Jules\n[includeIf "hasconfig:user.name=Jules"]\npath = jules-config',
					"jules-config": "[core]\nexcludesfile = jules-ignore",
					"jules-ignore": "jules-only",
				},
				"jules-only": "",
				"other-file": "",
			},
			["other-file"],
		)
	})
})
