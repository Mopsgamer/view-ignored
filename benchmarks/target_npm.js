import walk from "ignore-walk"
import { barplot, bench, run, summary } from "mitata"
import * as fs from "node:fs"

import { scan as browserScan } from "../out/browser.js"
import { scan } from "../out/index.js"
import { makeNPM } from "../out/targets/index.js"

const igw = process.argv.includes("--igw")
const vign = process.argv.includes("--vign")
const cwd = process.cwd()

console.log("NPM target benchmark")
console.log("You can use --igw to test ignore-walk separately")
console.log("You can use --vign to test view-ignored separately")

barplot(() => {
	summary(async () => {
		if (!igw)
			bench("'view-ignored'.scan(NPM, skipInternal)", async () => {
				return scan({
					cwd,
					fs,
					skipInternal: true,
					target: makeNPM(),
				})
			})
		if (!igw)
			bench("'view-ignored'.browserScan(NPM, skipInternal)", async () => {
				return browserScan({
					cwd,
					fs,
					skipInternal: true,
					target: makeNPM(),
				})
			})
		if (!igw)
			bench("'view-ignored'.scan(NPM)", async () => {
				return scan({ cwd, fs, target: makeNPM() })
			})
		if (!igw)
			bench("'view-ignored'.browserScan(NPM)", async () => {
				return browserScan({ cwd, fs, target: makeNPM() })
			})
		if (!vign)
			bench("'ignore-walk'.walk(.gitignore, .npmignore)", async () => {
				return walk({ ignoreFiles: [".npmignore", ".gitignore"] })
			})
	})
})

const stats = await run({
	format: process.argv.includes("--json") ? "json" : "mitata",
})

if (process.argv.includes("--json")) {
	process.stdout.write(JSON.stringify(stats))
}
