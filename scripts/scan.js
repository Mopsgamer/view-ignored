import { scan } from "../out/scan.js"
import * as Targets from "../out/targets/index.js"

const args = process.argv.slice(2)
const targetFlag = args.find((a) => a.startsWith("--target="))
const targetName = targetFlag ? targetFlag.split("=")[1] : "Git"
const skipInternal = args.includes("--skipInternal")
const printPaths = args.includes("--print")

const targetMaker = Targets["make" + targetName]
if (!targetMaker) {
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
	skipInternal,
	target: targetMaker(),
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
const total = ctx.total.get(".")
console.log(`- Total Files: ${total.totalFiles}`)
console.log(`- Total Dirs: ${total.totalDirs}`)
console.log(`- Total Matched: ${total.totalMatchedFiles}`)
