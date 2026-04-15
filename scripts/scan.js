import * as fs from "node:fs"

import { scan } from "../out/scan.js"
import * as Targets from "../out/targets/index.js"

const args = process.argv.slice(2)
const targetFlag = args.find((a) => a.startsWith("--target="))
const targetName = targetFlag ? targetFlag.split("=")[1] : "Git"
const fastInternal = args.includes("--fastInternal")
const printPaths = args.includes("--print")

const target = Targets[targetName]
if (!target) {
	console.error(
		`Unknown target: ${targetName}. Available: ${Object.keys(Targets)
			.filter((k) => k !== "Target")
			.join(", ")}`,
	)
	process.exit(1)
}

console.log(`Scanning "${process.cwd()}" with target: ${targetName}`)
const start = performance.now()
const ctx = await scan({
	cwd: process.cwd(),
	fastInternal,
	fs,
	target,
})
const end = performance.now()

if (printPaths) {
	console.log("\nMatched paths:")
	const sortedPaths = Array.from(ctx.paths.keys()).sort()
	for (const path of sortedPaths) {
		const match = ctx.paths.get(path)
		if (!match.ignored) {
			console.log(`  ${path}`)
		}
	}
	console.log("")
}

console.log(`- Time: ${(end - start).toFixed(2)}ms`)
console.log(`- Total Files: ${ctx.totalFiles}`)
console.log(`- Total Dirs: ${ctx.totalDirs}`)
console.log(`- Total Matched: ${ctx.totalMatchedFiles}`)
