import { describe, test, expect } from "bun:test"
import { $ } from "bun"

import { scan } from "./scan.js"
import { makeNPM } from "./targets/npm.js"
import { sortFirstFolders } from "./testSort.test.js"

describe.skipIf(!!process.env.TEST_NO_SELF)("NPM", async () => {
	const npm = npmTotalFiles()
	const r = await scan({ fastInternal: true, target: makeNPM() })
	// this test uses sortFirstFolders implementation
	// provided by https://jsr.io/@m234/path/0.1.4/sort-cmp.ts
	// you can install this jsr package in your project
	// for sorting - new Set(sorted) keeps sorting :),
	// but your package and dependents should also declare
	// @jsr:registry=https://npm.jsr.io in .npmrc or something.
	test(
		"scans self",
		async () => {
			expect(sortFirstFolders(r.paths.keys()).filter((path) => !path.endsWith("/"))).toEqual(
				expect.arrayContaining(sortFirstFolders((await npm).files)),
			)
		},
		{ timeout: 120e3 },
	)
	test(
		"scans self count",
		async () => {
			expect(r.total.get(".")?.totalMatchedFiles).toEqual((await npm).total)
			expect((await npm).total).toBe((await npm).files.length)
		},
		{ timeout: 120e3 },
	)
})

async function npmTotalFiles(): Promise<{ total: number; files: string[] }> {
	const { stdout, stderr, exitCode } = await $`npm pack --dry-run`.env({ NO_COLOR: "1" }).quiet()
	const output = stdout.toString() + stderr.toString()

	if (exitCode !== 0) {
		throw new Error(`'npm pack --dry-run' exited with code ${exitCode}\n${output}`)
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
	if (!match || !match[1]) {
		throw new Error("Could not find total files in npm pack output")
	}
	return {
		files,
		total: parseInt(match[1], 10),
	}
}
