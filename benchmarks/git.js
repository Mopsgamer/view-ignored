import walk from "ignore-walk"
import { run, bench, summary, barplot } from "mitata"
import * as fs from "node:fs"

import { scan as browserScan } from "../out/browser.js"
import { scan } from "../out/index.js"
import { Git as target } from "../out/targets/index.js"

const igw = process.argv.includes("--igw")
const vign = process.argv.includes("--vign")
const cwd = process.cwd()

console.log("Git target benchmark")
console.log("You can use --igw to test ignore-walk separately")
console.log("You can use --vign to test view-ignored separately")

barplot(() => {
	summary(async () => {
		if (!igw)
			bench("scan (fast)", async () => {
				return scan({ cwd, fastDepth: true, fastInternal: true, fs, target })
			})
		if (!igw)
			bench("browserScan (fast)", async () => {
				return browserScan({ cwd, fastDepth: true, fastInternal: true, fs, target })
			})
		if (!igw)
			bench("scan", async () => {
				return scan({ cwd, fs, target })
			})
		if (!igw)
			bench("browserScan", async () => {
				return browserScan({ cwd, fs, target })
			})
		if (!vign)
			bench("ignoreWalk", async () => {
				return walk({ ignoreFiles: [".gitignore"] })
			})
	})
})

await run()
