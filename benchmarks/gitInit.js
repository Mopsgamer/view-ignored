import { run, bench, summary, barplot } from "mitata"
import * as fs from "node:fs"

import { createGit } from "../out/targets/index.js"

const cwd = process.cwd()

console.log("Git Init benchmark")

barplot(() => {
	summary(() => {
		bench("Git.init", async () => {
			const target = createGit()
			return new Promise((resolve) => {
				target.init({ cwd, fs, signal: null, target }, () => {
					resolve()
				})
			})
		})
	})
})

await run()
