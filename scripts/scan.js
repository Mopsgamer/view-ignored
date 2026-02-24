import * as fs from "node:fs"

import { scan } from "../out/index.js"
import { Git as target } from "../out/targets/index.js"

await scan({
	target,
	fs,
	cwd: process.cwd(),
	fastInternal: process.argv.includes("--fastInternal"),
})
