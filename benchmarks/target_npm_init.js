import { barplot, bench, run, summary } from "mitata"
import * as fs from "node:fs"

import { makeNPM } from "../out/targets/npm.js"

const cwd = process.cwd()

// Precache npm target rules to avoid data skewing
await new Promise((resolve) => {
	const target = makeNPM()
	target.init({ cwd, fs, signal: null, target }, resolve)
})

const npmInitPromise = Object.create(Promise.prototype)
// oxlint-disable-next-line unicorn/no-thenable
npmInitPromise.then = function then(resolve) {
	const target = makeNPM()
	target.init({ cwd, fs, signal: null, target }, resolve)
}

console.log("NPM Init benchmark")

barplot(() => {
	summary(() => {
		bench("'view-ignored'.NPM.init", () => npmInitPromise)
	})
})

const stats = await run({
	format: process.argv.includes("--json") ? "json" : "mitata",
})

if (process.argv.includes("--json")) {
	process.stdout.write(JSON.stringify(stats))
}
