import walk from "ignore-walk"
import { run, bench, do_not_optimize, summary, barplot } from "mitata"
import * as fs from "node:fs"

import { scan as browserScan } from "../out/browser.js"
import { scan } from "../out/index.js"
import { Git as target } from "../out/targets/index.js"

barplot(() => {
	summary(() => {
		const gc = "inner"
		bench("scan (fast)", async () => {
			return do_not_optimize(
				await scan({ target, fs, cwd: process.cwd(), fastInternal: true, fastDepth: true }),
			)
		}).gc(gc)
		bench("browserScan (fast)", async () => {
			return do_not_optimize(
				await browserScan({ target, fs, cwd: process.cwd(), fastInternal: true, fastDepth: true }),
			)
		}).gc(gc)
		bench("scan", async () => {
			return do_not_optimize(await scan({ target, fs, cwd: process.cwd() }))
		}).gc(gc)
		bench("browserScan", async () => {
			return do_not_optimize(await browserScan({ target, fs, cwd: process.cwd() }))
		}).gc(gc)
		bench("ignoreWalk", () => {
			return do_not_optimize(walk.sync({ ignoreFiles: [".gitignore"] }))
		}).gc(gc)
	})
})

await run()
