import { barplot, bench, run, summary } from "mitata"
import * as fs from "node:fs"

import { makeGit } from "../out/targets/index.js"

const cwd = process.cwd()

console.log("Git Init benchmark")

barplot(() => {
	summary(() => {
		bench("'view-ignored'.Git.init", async () => {
			return new Promise((resolve) => {
				makeGit().init({ cwd, fs, signal: null, target: makeGit() }, () => {
					resolve()
				})
			})
		})
	})
})

await run()
