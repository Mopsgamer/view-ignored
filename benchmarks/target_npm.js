import Arborist from "@npmcli/arborist"
import walk from "ignore-walk"
import { barplot, bench, run, summary } from "mitata"
import { execSync } from "node:child_process"
import * as fs from "node:fs"
import packlist from "npm-packlist"

import { scan as browserScan } from "../out/browser.js"
import { scan } from "../out/index.js"
import { makeNPM } from "../out/targets/index.js"

// Precache npm target rules to avoid data skewing
makeNPM()

const igw = process.argv.includes("--igw")
const vign = process.argv.includes("--vign")
const cwd = process.cwd()

// Precache Arborist tree to avoid data skewing
const arborist = new Arborist({ path: cwd })
let tree = await arborist.loadActual()

console.log("NPM target benchmark")
console.log("You can use --igw to test ignore-walk separately")
console.log("You can use --vign to test view-ignored separately")

// Run the normal benchmarks first (excluding the inverted browserScan which runs on real files)
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
		if (!igw)
			bench("'view-ignored'.scan(NPM, inverted)", async () => {
				return scan({
					cwd,
					fs,
					invert: true,
					target: makeNPM(),
				})
			})
		if (!vign)
			bench("'npm-packlist'(preparedArbTree)", async () => {
				return packlist(tree)
			})
		if (!vign)
			bench("'ignore-walk'.walk(.gitignore, .npmignore)", async () => {
				return walk({ ignoreFiles: [".npmignore", ".gitignore"] })
			})
	})

	if (!vign) {
		summary(() => {
			bench("'npmcli/arborist'.loadActual()", async () => {
				return arborist.loadActual()
			})
		})
	}
})

const stats = await run({
	format: process.argv.includes("--json") ? "json" : "mitata",
})

if (process.argv.includes("--json")) {
	process.stdout.write(JSON.stringify(stats))
}

// Run the inverted browserScan benchmark on real files
let stats2 = null
if (!igw) {
	console.log(
		"\nPreparing real node_modules files using bun for the inverted browserScan benchmark...",
	)
	try {
		execSync("bun install --linker hoisted --no-global-store --backend=copyfile", {
			stdio: "inherit",
		})
		barplot(() => {
			summary(async () => {
				bench("'view-ignored'.browserScan(NPM, inverted)", async () => {
					return browserScan({
						cwd,
						fs,
						invert: true,
						target: makeNPM(),
					})
				})
			})
		})

		stats2 = await run({
			format: process.argv.includes("--json") ? "json" : "mitata",
		})
	} finally {
		console.log("Restoring symlinks in node_modules using bun...")
		execSync("bun install", { stdio: "inherit" })
	}
}

if (stats2 && process.argv.includes("--json")) {
	process.stdout.write(JSON.stringify(stats2))
}
