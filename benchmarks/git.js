import walk from "ignore-walk"
import { barplot, bench, run, summary } from "mitata"
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
			bench("'view-ignored'.scan(Git, fastInternal)", async () => {
				return scan({
					cwd,
					fastInternal: true,
					fs,
					target,
				})
			})
		if (!igw)
			bench("'view-ignored'.browserScan(Git, fastInternal)", async () => {
				return browserScan({
					cwd,
					fastInternal: true,
					fs,
					target,
				})
			})
		if (!igw)
			bench("'view-ignored'.scan(Git)", async () => {
				return scan({ cwd, fs, target })
			})
		if (!igw)
			bench("'view-ignored'.browserScan(Git)", async () => {
				return browserScan({ cwd, fs, target })
			})
		if (!vign)
			bench("'ignore-walk'.walk(.gitignore)", async () => {
				return walk({ ignoreFiles: [".gitignore"] })
			})
	})
})

const stats = await run({
	format: process.argv.includes("--json") ? "json" : "mitata",
})

if (process.argv.includes("--json")) {
	process.stdout.write(JSON.stringify(stats))
}
