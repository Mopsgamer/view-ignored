import { scan } from "./scan.js"
import { describe, test } from "bun:test"
import { deepEqual } from "node:assert/strict"
import { Git as target } from "./targets/git.js"
import { sortFirstFolders } from "./testSort.test.js"
import { spawn } from "node:child_process"

describe.skipIf(!!process.env.TEST_NO_SELF)("Git", () => {
	test(
		"scans self",
		async () => {
			const files = gitFiles()
			const r = await scan({ target, fastInternal: true })
			// this test uses sortFirstFolders implementation
			// provided by https://jsr.io/@m234/path/0.1.4/sort-cmp.ts
			// you can install this jsr package in your project
			// for sorting - new Set(sorted) keeps sorting :),
			// but your package and dependents should also declare
			// @jsr:registry=https://npm.jsr.io in .npmrc or something.
			deepEqual(
				sortFirstFolders(r.paths).filter((path) => !path.endsWith("/")),
				sortFirstFolders(await files),
			)
		},
		{ timeout: 120e3 },
	)
})

function gitFiles(): Promise<string[]> {
	const git = spawn("git", ["ls-files", "--others", "--exclude-standard", "--cached"], {
		env: { NO_COLOR: "1" },
	})
	return new Promise((resolve, reject) => {
		let output = ""
		git.stdout.on("data", (data) => {
			output += data.toString()
		})
		git.stderr.on("data", (data) => {
			output += data.toString()
		})
		git.on("close", (code) => {
			if (code !== 0) {
				reject(new Error(`'git ls-files --others --exclude-standard --cached' exited with code ${code}\n${output}`))
				return
			}
			const files = output.trim().split("\n")
			resolve(files)
		})
	})
}
