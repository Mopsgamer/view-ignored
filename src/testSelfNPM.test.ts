import { describe, test, expect } from "bun:test"
import { spawn } from "node:child_process"

import { scan } from "./scan.js"
import { NPM as target } from "./targets/npm.js"
import { sortFirstFolders } from "./testSort.test.js"

describe.skipIf(!!process.env.TEST_NO_SELF)("NPM", () => {
	test(
		"scans self",
		async () => {
			const npm = npmTotalFiles()
			const r = await scan({ target, fastInternal: true })
			// this test uses sortFirstFolders implementation
			// provided by https://jsr.io/@m234/path/0.1.4/sort-cmp.ts
			// you can install this jsr package in your project
			// for sorting - new Set(sorted) keeps sorting :),
			// but your package and dependents should also declare
			// @jsr:registry=https://npm.jsr.io in .npmrc or something.
			expect(r.totalMatchedFiles).toBe((await npm).total)
			expect((await npm).total).toBe((await npm).files.length)
			expect(sortFirstFolders(r.paths.keys()).filter((path) => !path.endsWith("/"))).toMatchObject(
				sortFirstFolders((await npm).files),
			)
		},
		{ timeout: 120e3 },
	)
})

function npmTotalFiles(): Promise<{ total: number; files: string[] }> {
	const npm = spawn("npm", ["pack", "--dry-run"], { env: { NO_COLOR: "1" } })
	return new Promise((resolve, reject) => {
		let output = ""
		npm.stdout.on("data", (data) => {
			output += data.toString()
		})
		npm.stderr.on("data", (data) => {
			output += data.toString()
		})
		npm.on("close", (code) => {
			if (code !== 0) {
				reject(new Error(`'npm pack --dry-run' exited with code ${code}\n${output}`))
				return
			}
			const match = output.match(/total files:\s+(\d+)/)
			const files: string[] = []
			const lines = output.split(/\r?\n/)
			let inContents = false
			for (const line of lines) {
				if (line.startsWith("npm notice Tarball Contents")) {
					inContents = true
					continue
				}
				if (!inContents) {
					continue
				}
				if (line.startsWith("npm notice Tarball Details")) {
					break
				}
				const fileMatch = line.match(/npm notice\s+\S+\s+(.+)/)
				if (fileMatch && fileMatch[1]) {
					const file = fileMatch[1].trim()
					files.push(file)
				}
			}
			if (match && match[1]) {
				resolve({
					total: parseInt(match[1], 10),
					files,
				})
				return
			}
			reject(new Error("Could not find total files in npm pack output"))
		})
	})
}
