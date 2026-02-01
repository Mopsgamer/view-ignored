import { test } from "node:test"
import { testScan } from "../0_testScan.test.js"
import { deepEqual, equal, ok } from "node:assert/strict"
import {
	matcherContextAddPath,
	matcherContextRefreshDir,
	matcherContextRemovePath,
} from "./matcher_context.js"
import { Git as target } from "../targets/git.js"

void test("can add paths", async () => {
	await testScan(
		{
			one: "",
			two: "",
			".gitignore": "four",
		},
		async ({ options: { target, cwd }, ctx }) => {
			const options = { target, cwd }
			ok(await matcherContextAddPath(ctx, "three", options))
			ok(await matcherContextAddPath(ctx, "two", options))
			ok(!(await matcherContextAddPath(ctx, "four", options)))
			equal(ctx.paths.size, 4)
			equal(ctx.totalMatchedFiles, ctx.paths.size)
		},
		{ target },
	)
})

void test("can remove paths", async () => {
	await testScan(
		{
			one: "",
			two: "",
			".gitignore": "four",
		},
		async ({ options: { depth }, ctx }) => {
			const options = { depth }
			equal(ctx.paths.size, 3)
			await matcherContextRemovePath(ctx, "three", options)
			equal(ctx.paths.size, 3)
			await matcherContextRemovePath(ctx, "two", options)
			equal(ctx.paths.size, 2)
			equal(ctx.totalMatchedFiles, ctx.paths.size)
			await matcherContextRemovePath(ctx, "./", options)
			equal(ctx.paths.size, 0)
		},
		{ target },
	)
})

void test("can refresh without changes", async () => {
	await testScan(
		{
			one: "",
			two: "",
			".gitignore": "four",
		},
		async ({ options, ctx }) => {
			const oldDepthPaths = [...ctx.depthPaths]
			const oldExternal = [...ctx.external]
			const oldFailed = ctx.failed
			const oldPaths = [...ctx.paths]
			const oldTotalDirs = ctx.totalDirs
			const oldTotalFiles = ctx.totalFiles
			const oldTotalMatchedFiles = ctx.totalMatchedFiles
			await matcherContextRefreshDir(ctx, ".", options)
			deepEqual([...ctx.depthPaths], oldDepthPaths)
			deepEqual([...ctx.external], oldExternal)
			deepEqual(ctx.failed, oldFailed)
			deepEqual([...ctx.paths], oldPaths)
			deepEqual(ctx.totalDirs, oldTotalDirs)
			deepEqual(ctx.totalFiles, oldTotalFiles)
			deepEqual(ctx.totalMatchedFiles, oldTotalMatchedFiles)
		},
		{ target },
	)
})
