import { barplot, bench, run, summary } from "mitata"
import * as fs from "node:fs"

import {
	matcherContextAddPath,
	matcherContextRemovePath,
} from "../out/patterns/matcherContextPatch.js"
import { scan } from "../out/scan.js"
import { makeNPM } from "../out/targets/npm.js"
import { unixify } from "../out/unixify.js"

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

barplot(() => {
	summary(async () => {
		bench("matcherContextRemovePath (file)", async () => {
			await matcherContextRemovePath(ctx, options, pathToRem)
			// add it back for next iteration
			await matcherContextAddPath(ctx, options, pathToRem)
		})

		bench("matcherContextAddPath (file)", async () => {
			// Ensure it's removed first
			await matcherContextRemovePath(ctx, options, pathToRem)
			await matcherContextAddPath(ctx, options, pathToAdd)
		})

		bench("matcherContextRemovePath (dir)", async () => {
			await matcherContextRemovePath(ctx, options, dirToRem)
			// add it back for next iteration
			await matcherContextAddPath(ctx, options, dirToAdd)
		})

		bench("matcherContextAddPath (dir)", async () => {
			// Ensure it's removed first
			await matcherContextRemovePath(ctx, options, dirToRem)
			await matcherContextAddPath(ctx, options, dirToAdd)
		})
	})
})

await run()
