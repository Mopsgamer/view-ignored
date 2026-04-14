import walk from "ignore-walk"
import { run, bench, summary, barplot } from "mitata"
import * as fs from "node:fs"

import { scan as browserScan } from "../out/browser.js"
import { scan } from "../out/index.js"
import { Git as target } from "../out/targets/index.js"

const igw = process.argv.includes("--igw")
const vign = process.argv.includes("--vign")

barplot(() => {
	summary(async () => {
		const gc = "inner"
		if (!igw)
			bench("scan (fast)", async () => {
				return scan({ target, fs, cwd: process.cwd(), fastInternal: true, fastDepth: true })
			}).gc(gc)
		if (!igw)
			bench("browserScan (fast)", async () => {
				return browserScan({ target, fs, cwd: process.cwd(), fastInternal: true, fastDepth: true })
			}).gc(gc)
		if (!igw)
			bench("scan", async () => {
				return scan({ target, fs, cwd: process.cwd() })
			}).gc(gc)
		if (!igw)
			bench("browserScan", async () => {
				return browserScan({ target, fs, cwd: process.cwd() })
			}).gc(gc)
		if (!vign)
			bench("ignoreWalk", async () => {
				return walk({ ignoreFiles: [".gitignore"] })
			}).gc(gc)
	})
})

await run()
