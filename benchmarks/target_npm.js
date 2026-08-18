import Arborist from "@npmcli/arborist"
import walk from "ignore-walk"
import { barplot, bench, run, summary } from "mitata"
import * as fs from "node:fs"
import packlist from "npm-packlist"

import { scan as browserScan } from "../out/browser.js"
import { scan } from "../out/index.js"
import { makeNPM } from "../out/targets/index.js"

// Precache npm target rules to avoid data skewing
makeNPM()

const igw = process.argv.includes("--igw")
const vign = process.argv.includes("--vign")
const cwd = process.cwd()

// Precache Arborist tree to avoid data skewing
const arborist = new Arborist({ path: cwd })
let tree = await arborist.loadActual()

if (!igw) {
	for (let i = 0; i < 10; i++) {
		// oxlint-disable-next-line eslint/no-await-in-loop
		await scan({ cwd, fs, skipInternal: true, target: makeNPM() })
		// oxlint-disable-next-line eslint/no-await-in-loop
		await browserScan({ cwd, fs, skipInternal: true, target: makeNPM() })
		// oxlint-disable-next-line eslint/no-await-in-loop
		await scan({ cwd, fs, target: makeNPM() })
		// oxlint-disable-next-line eslint/no-await-in-loop
		await browserScan({ cwd, fs, target: makeNPM() })
		// oxlint-disable-next-line eslint/no-await-in-loop
		await scan({ cwd, fs, invert: true, target: makeNPM() })
		// oxlint-disable-next-line eslint/no-await-in-loop
		await browserScan({ cwd, fs, invert: true, target: makeNPM() })
	}
}
if (!vign) {
	for (let i = 0; i < 5; i++) {
		// oxlint-disable-next-line eslint/no-await-in-loop
		await packlist(tree)
		// oxlint-disable-next-line eslint/no-await-in-loop
		await walk({ ignoreFiles: [".npmignore", ".gitignore"] })
		// oxlint-disable-next-line eslint/no-await-in-loop
		await arborist.loadActual()
	}
}
globalThis.gc?.()

console.log("NPM target benchmark")
console.log("You can use --igw to test ignore-walk separately")
console.log("You can use --vign to test view-ignored separately")

barplot(() => {
	summary(async () => {
		if (!igw)
			bench("'view-ignored'.scan(NPM, skipInternal)", async () => {
				return scan({
					cwd,
					fs,
					skipInternal: true,
					target: makeNPM(),
				})
			}).gc(true)
		if (!igw)
			bench("'view-ignored'.browserScan(NPM, skipInternal)", async () => {
				return browserScan({
					cwd,
					fs,
					skipInternal: true,
					target: makeNPM(),
				})
			}).gc(true)
		if (!igw)
			bench("'view-ignored'.scan(NPM)", async () => {
				return scan({ cwd, fs, target: makeNPM() })
			}).gc(true)
		if (!igw)
			bench("'view-ignored'.browserScan(NPM)", async () => {
				return browserScan({ cwd, fs, target: makeNPM() })
			}).gc(true)
		if (!igw)
			bench("'view-ignored'.scan(NPM, inverted)", async () => {
				return scan({
					cwd,
					fs,
					invert: true,
					target: makeNPM(),
				})
			}).gc(true)
		if (!igw)
			bench("'view-ignored'.browserScan(NPM, inverted)", async () => {
				return browserScan({
					cwd,
					fs,
					invert: true,
					target: makeNPM(),
				})
			}).gc(true)
		if (!vign)
			bench("'npm-packlist'(preparedArbTree)", async () => {
				return packlist(tree)
			}).gc(true)
		if (!vign)
			bench("'ignore-walk'.walk(.gitignore, .npmignore)", async () => {
				return walk({ ignoreFiles: [".npmignore", ".gitignore"] })
			}).gc(true)
	})

	if (!vign) {
		summary(() => {
			bench("'npmcli/arborist'.loadActual()", async () => {
				return arborist.loadActual()
			}).gc(true)
		})
	}
})

const stats = await run({
	format: process.argv.includes("--json") ? "json" : "mitata",
})

if (process.argv.includes("--json")) {
	process.stdout.write(JSON.stringify(stats))
}
