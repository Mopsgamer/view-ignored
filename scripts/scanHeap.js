import * as fs from "node:fs"
import v8 from "node:v8"

import { scan } from "../out/scan.js"
import * as Targets from "../out/targets/index.js"

// Helper to format bytes to MB
const toMB = (bytes) => (bytes / 1024 / 1024).toFixed(2) + " MB"

function getMemoryReport() {
	const stats = v8.getHeapStatistics()
	const usage = process.memoryUsage()
	return {
		external: toMB(usage.external),
		heapUsed: toMB(stats.used_heap_size),
		total: toMB(stats.total_heap_size),
	}
}

const args = process.argv.slice(2)
const targetFlag = args.find((a) => a.startsWith("--target="))
const targetName = targetFlag ? targetFlag.split("=")[1] : "Git"
const fastInternal = args.includes("--fastInternal")
const printPaths = args.includes("--print")
const takeSnapshot = args.includes("--snapshot")

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

// Capture baseline memory
const memBefore = getMemoryReport()
const start = performance.now()

const ctx = await scan({
	cwd: process.cwd(),
	fastInternal,
	fs,
	target,
})

const end = performance.now()
const memAfter = getMemoryReport()

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

console.log(`--- Execution Stats ---`)
console.log(`- Time: ${(end - start).toFixed(2)}ms`)
console.log(`- Total Files: ${ctx.totalFiles}`)
console.log(`- Total Dirs: ${ctx.totalDirs}`)
console.log(`- Total Matched: ${ctx.totalMatchedFiles}`)

console.log(`\n--- Heap Memory Report ---`)
console.log(`- Used Before: ${memBefore.heapUsed}`)
console.log(`- Used After:  ${memAfter.heapUsed}`)
console.log(`- External (Buffers): ${memAfter.external}`)

if (takeSnapshot) {
	const runtime = typeof Bun !== "undefined" ? "me" : "me.node"
	const filename = `HEAP.${runtime}.heapsnapshot`
	console.log(`\nWriting heap snapshot to ${filename}...`)
	v8.writeHeapSnapshot(filename)
	console.log("Done. Load this file into Chrome DevTools (Memory -> Load).")
}
