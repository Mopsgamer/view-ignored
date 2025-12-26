import { scan } from "./scan.js"
import { test } from "node:test"
import { deepEqual, equal } from "node:assert/strict"
import { NPM as target } from "./targets/npm.js"
import { sortFirstFolders } from "./scan_sort.test.js"
import { spawn } from "node:child_process"

void test("scan NPM (self, flat)", async () => {
	const npmTotoalFiles = npmTotalFiles()
	const r = await scan({ target, depth: 0, invert: false })
	// this test uses sortFirstFolders implementation
	// provided by https://jsr.io/@m234/path/0.1.4/sort-cmp.ts
	// you can install this jsr package in your project
	// for sorting - new Set(sorted) keeps sorting :),
	// but your package and dependents should also declare
	// @jsr:registry=https://npm.jsr.io in .npmrc or something.
	const paths = sortFirstFolders(r.paths)
	deepEqual(paths, ["out/", "LICENSE.txt", "package.json", "README.md"])

	equal(r.totalMatchedFiles, await npmTotoalFiles)
})

function npmTotalFiles(): Promise<number> {
	const npm = spawn("npm", ["pack", "--dry-run"])
	return new Promise((resolve, reject) => {
		let output = ""
		npm.stdout.on("data", (data) => {
			output += data.toString()
		})
		npm.stderr.on("data", (data) => {
			output += data.toString()
		})
		npm.on("close", () => {
			const match = output.match(/total files:\s+(\d+)/)
			if (match && match[1]) {
				resolve(parseInt(match[1], 10))
				return
			}
			reject(new Error("Could not find total files in npm pack output"))
		})
	})
}
