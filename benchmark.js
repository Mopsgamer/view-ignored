import * as fs from "node:fs"

import walk from "ignore-walk"
import { run, bench, do_not_optimize, summary, barplot } from "mitata"

import { scan } from "./out/index.js"
import { scan as browserScan } from "./out/browser.js"
import { Git as target } from "./out/targets/index.js"

barplot(() => {
	summary(() => {
		bench("scan", async () => {
			return do_not_optimize(await scan({ target, fs, cwd: process.cwd(), fastInternal: true }))
		})
		bench("browserScan", async () => {
			return do_not_optimize(await browserScan({ target, fs, cwd: process.cwd(), fastInternal: true }))
		})
		bench("ignoreWalk", async () => {
			return do_not_optimize(await walk({ ignoreFiles: [ '.gitignore' ], }))
		})
	})
})

await run()
