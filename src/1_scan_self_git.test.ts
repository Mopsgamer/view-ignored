import { scan } from "./scan.js"
import { test } from "node:test"
import { deepEqual } from "node:assert/strict"
import { Git as target } from "./targets/git.js"
import { sortFirstFolders } from "./0_testSort.test.js"
import { spawn } from "node:child_process"

void test("scan Git (self)", async () => {
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
})

function gitFiles(): Promise<string[]> {
	const git = spawn("git", ["ls-tree", "-r", "HEAD", "--name-only"], { env: { NO_COLOR: "1" } })
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
				reject(new Error(`'git ls-tree -r HEAD --name-only' exited with code ${code}\n${output}`))
				return
			}
			const files = output.trim().split("\n")
			resolve(files)
		})
	})
}
