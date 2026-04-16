import walk from "ignore-walk"
import { run, bench, summary, barplot } from "mitata"
import * as fs from "node:fs"

import { scan as browserScan } from "../out/browser.js"
import { scan } from "../out/index.js"
import { Git as target } from "../out/targets/index.js"

const igw = process.argv.includes("--igw")
const vign = process.argv.includes("--vign")

if (!igw) {
	await scan({ cwd: process.cwd(), fastDepth: true, fastInternal: true, fs, target })
	await browserScan({ cwd: process.cwd(), fastDepth: true, fastInternal: true, fs, target })
	await scan({ cwd: process.cwd(), fs, target })
	await browserScan({ cwd: process.cwd(), fs, target })
}
if (!vign) {
	await walk({ ignoreFiles: [".gitignore"] })
}

barplot(() => {
	summary(async () => {
		const gc = "inner"
		if (!igw)
			bench("scan (fast)", async () => {
				return scan({ cwd: process.cwd(), fastDepth: true, fastInternal: true, fs, target })
			}).gc(gc)
		if (!igw)
			bench("browserScan (fast)", async () => {
				return browserScan({ cwd: process.cwd(), fastDepth: true, fastInternal: true, fs, target })
			}).gc(gc)
		if (!igw)
			bench("scan", async () => {
				return scan({ cwd: process.cwd(), fs, target })
			}).gc(gc)
		if (!igw)
			bench("browserScan", async () => {
				return browserScan({ cwd: process.cwd(), fs, target })
			}).gc(gc)
		if (!vign)
			bench("ignoreWalk", async () => {
				return walk({ ignoreFiles: [".gitignore"] })
			}).gc(gc)
	})
})

await run()
