import { barplot, bench, run, summary } from "mitata"
import * as fs from "node:fs"

import {
	matcherContextAddPath,
	matcherContextRemovePath,
} from "../out/patterns/matcherContextPatch.js"
import { scan } from "../out/scan.js"
import { makeNPM } from "../out/targets/npm.js"
import { unixify } from "../out/unixify.js"

// Precache npm target rules to avoid data skewing
makeNPM()

const cwd = unixify(process.cwd())
const target = makeNPM()
const options = {
	cwd,
	depth: Infinity,
	dirs: true,
	fs,
	invert: false,
	signal: null,
	skipDepth: false,
	skipInternal: false,
	target,
	within: ".",
}

// Initial scan to get a context
const ctx = await scan(options)

// We need to pick some paths to add/remove.
// Let's assume some paths that might exist or we can simulate.
// Since we are running in the repo, we can use real paths.
const pathToRem = "src/walk.ts"
const pathToAdd = "src/walk.ts"
const dirToRem = "src/patterns/"
const dirToAdd = "src/patterns/"

// Warmup loop to stabilize CPU frequency and JIT compilation
const warmupEnd = Date.now() + 100
while (Date.now() < warmupEnd) {
	// oxlint-disable-next-line eslint/no-await-in-loop
	await matcherContextRemovePath(ctx, options, pathToRem)
	// oxlint-disable-next-line eslint/no-await-in-loop
	await matcherContextAddPath(ctx, options, pathToAdd)
}
globalThis.gc?.()

barplot(() => {
	summary(async () => {
		bench("matcherContextRemovePath (file)", async (state) => {
			for (const _ of state) {
				// oxlint-disable-next-line eslint/no-await-in-loop
				await matcherContextRemovePath(ctx, options, pathToRem)
				// oxlint-disable-next-line eslint/no-await-in-loop
				await matcherContextAddPath(ctx, options, pathToRem)
			}
		})

		bench("matcherContextAddPath (file)", async (state) => {
			for (const _ of state) {
				// oxlint-disable-next-line eslint/no-await-in-loop
				await matcherContextRemovePath(ctx, options, pathToRem)
				// oxlint-disable-next-line eslint/no-await-in-loop
				await matcherContextAddPath(ctx, options, pathToAdd)
			}
		})

		bench("matcherContextRemovePath (dir)", async (state) => {
			for (const _ of state) {
				// oxlint-disable-next-line eslint/no-await-in-loop
				await matcherContextRemovePath(ctx, options, dirToRem)
				// oxlint-disable-next-line eslint/no-await-in-loop
				await matcherContextAddPath(ctx, options, dirToAdd)
			}
		})

		bench("matcherContextAddPath (dir)", async (state) => {
			for (const _ of state) {
				// oxlint-disable-next-line eslint/no-await-in-loop
				await matcherContextRemovePath(ctx, options, dirToRem)
				// oxlint-disable-next-line eslint/no-await-in-loop
				await matcherContextAddPath(ctx, options, dirToAdd)
			}
		})
	})
})

const stats = await run({
	format: process.argv.includes("--json") ? "json" : "mitata",
})

if (process.argv.includes("--json")) {
	process.stdout.write(JSON.stringify(stats))
}
