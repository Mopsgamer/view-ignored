import { run, bench, summary, barplot } from "mitata"
import * as fs from "node:fs"

import { scan } from "../out/index.js"
import { Git as target } from "../out/targets/index.js"

const cwd = process.cwd()

console.log("Git Init benchmark")

barplot(() => {
	summary(async () => {
		bench("scan (with git init)", async () => {
			return scan({ cwd, fs, target })
		})
	})
})

await run()
