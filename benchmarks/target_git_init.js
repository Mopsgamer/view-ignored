import { barplot, bench, run, summary } from "mitata"
import * as fs from "node:fs"

import { makeGit } from "../out/targets/git.js"

const cwd = process.cwd()

// Precache git target rules to avoid data skewing
await new Promise((resolve) => {
	const target = makeGit()
	target.init({ cwd, fs, signal: null, target }, resolve)
})

const gitInitPromise = Object.create(Promise.prototype)
// oxlint-disable-next-line unicorn/no-thenable
gitInitPromise.then = function then(resolve) {
	const target = makeGit()
	target.init({ cwd, fs, signal: null, target }, resolve)
}

console.log("Git Init benchmark")

barplot(() => {
	summary(() => {
		bench("'view-ignored'.Git.init", () => gitInitPromise)
	})
})

const stats = await run({
	format: process.argv.includes("--json") ? "json" : "mitata",
})

if (process.argv.includes("--json")) {
	process.stdout.write(JSON.stringify(stats))
}
