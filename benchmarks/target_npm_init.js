import { barplot, bench, run, summary } from "mitata"
import * as fs from "node:fs"

import { makeNPM } from "../out/targets/index.js"

const cwd = process.cwd()

// Precache npm target rules to avoid data skewing
for (let i = 0; i < 50; i++) {
	// oxlint-disable-next-line eslint/no-await-in-loop
	await new Promise((resolve) => {
		const target = makeNPM()
		target.init({ cwd, fs, signal: null, target }, resolve)
	})
}
globalThis.gc?.()

console.log("NPM Init benchmark")

barplot(() => {
	summary(() => {
		bench("'view-ignored'.NPM.init", () =>
			new Promise((resolve) => {
				const target = makeNPM()
				target.init({ cwd, fs, signal: null, target }, resolve)
			})).gc(true)
	})
})

const stats = await run({
	format: process.argv.includes("--json") ? "json" : "mitata",
})

if (process.argv.includes("--json")) {
	process.stdout.write(JSON.stringify(stats))
}
