import walk from "ignore-walk"
import { barplot, bench, run, summary } from "mitata"
import * as fs from "node:fs"

import { scan as browserScan } from "../out/browser.js"
import { scan } from "../out/index.js"
import { makeGit } from "../out/targets/index.js"

// Precache git target rules to avoid data skewing
makeGit()

const igw = process.argv.includes("--igw")
const vign = process.argv.includes("--vign")
const cwd = process.cwd()

if (!igw) {
	for (let i = 0; i < 10; i++) {
		// oxlint-disable-next-line eslint/no-await-in-loop
		await scan({ cwd, fs, skipInternal: true, target: makeGit() })
		// oxlint-disable-next-line eslint/no-await-in-loop
		await browserScan({ cwd, fs, skipInternal: true, target: makeGit() })
		// oxlint-disable-next-line eslint/no-await-in-loop
		await scan({ cwd, fs, target: makeGit() })
		// oxlint-disable-next-line eslint/no-await-in-loop
		await browserScan({ cwd, fs, target: makeGit() })
		// oxlint-disable-next-line eslint/no-await-in-loop
		await scan({ cwd, fs, invert: true, target: makeGit() })
		// oxlint-disable-next-line eslint/no-await-in-loop
		await browserScan({ cwd, fs, invert: true, target: makeGit() })
	}
}
if (!vign) {
	await walk({ ignoreFiles: [".gitignore"] })
}
globalThis.gc?.()

console.log("Git target benchmark")
console.log("You can use --igw to test ignore-walk separately")
console.log("You can use --vign to test view-ignored separately")

barplot(() => {
	summary(async () => {
		if (!igw)
			bench("'view-ignored'.scan(Git, skipInternal)", async () => {
				return scan({
					cwd,
					fs,
					skipInternal: true,
					target: makeGit(),
				})
			}).gc(true)
		if (!igw)
			bench("'view-ignored'.browserScan(Git, skipInternal)", async () => {
				return browserScan({
					cwd,
					fs,
					skipInternal: true,
					target: makeGit(),
				})
			}).gc(true)
		if (!igw)
			bench("'view-ignored'.scan(Git)", async () => {
				return scan({ cwd, fs, target: makeGit() })
			}).gc(true)
		if (!igw)
			bench("'view-ignored'.browserScan(Git)", async () => {
				return browserScan({ cwd, fs, target: makeGit() })
			}).gc(true)
		if (!igw)
			bench("'view-ignored'.scan(Git, inverted)", async () => {
				return scan({
					cwd,
					fs,
					invert: true,
					target: makeGit(),
				})
			}).gc(true)
		if (!igw)
			bench("'view-ignored'.browserScan(Git, inverted)", async () => {
				return browserScan({
					cwd,
					fs,
					invert: true,
					target: makeGit(),
				})
			}).gc(true)
		if (!vign)
			bench("'ignore-walk'.walk(.gitignore)", async () => {
				return walk({ ignoreFiles: [".gitignore"] })
			}).gc(true)
	})
})

const stats = await run({
	format: process.argv.includes("--json") ? "json" : "mitata",
})

if (process.argv.includes("--json")) {
	process.stdout.write(JSON.stringify(stats))
}
