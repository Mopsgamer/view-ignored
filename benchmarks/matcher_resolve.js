import { barplot, bench, run, summary } from "mitata"
import * as fs from "node:fs"

import { resolveSources } from "../out/patterns/resolveSources.js"
import { makeNPM } from "../out/targets/npm.js"
import { unixify } from "../out/unixify.js"

// Precache npm target rules to avoid data skewing
makeNPM()

const cwd = unixify(process.cwd())
const target = makeNPM()
const external = new Map()

// Warmup loop to stabilize CPU frequency and JIT compilation
for (let i = 0; i < 20; i++) {
	external.clear()
	// oxlint-disable-next-line eslint/no-await-in-loop
	await new Promise((resolve, reject) => {
		resolveSources({ cwd, dir: ".", external, fs, signal: null, target }, (err, res) =>
			err ? reject(err) : resolve(res),
		)
	})
	external.clear()
	// oxlint-disable-next-line eslint/no-await-in-loop
	await new Promise((resolve, reject) => {
		resolveSources({ cwd, dir: "src/patterns", external, fs, signal: null, target }, (err, res) =>
			err ? reject(err) : resolve(res),
		)
	})
}
globalThis.gc?.()

barplot(() => {
	summary(async () => {
		bench("resolveSources (uncached, root)", async () => {
			external.clear()
			return new Promise((resolve, reject) => {
				resolveSources(
					{
						cwd,
						dir: ".",
						external,
						fs,
						signal: null,
						target,
					},
					(err, res) => (err ? reject(err) : resolve(res)),
				)
			})
		})

		bench("resolveSources (cached, root)", (state) => {
			for (const _ of state) {
				resolveSources(
					{
						cwd,
						dir: ".",
						external,
						fs,
						signal: null,
						target,
					},
					() => {},
				)
			}
		})

		bench("resolveSources (uncached, deep)", async () => {
			external.clear()
			return new Promise((resolve, reject) => {
				resolveSources(
					{
						cwd,
						dir: "src/patterns",
						external,
						fs,
						signal: null,
						target,
					},
					(err, res) => (err ? reject(err) : resolve(res)),
				)
			})
		})

		bench("resolveSources (cached, deep)", (state) => {
			for (const _ of state) {
				resolveSources(
					{
						cwd,
						dir: "src/patterns",
						external,
						fs,
						signal: null,
						target,
					},
					() => {},
				)
			}
		})
	})
})

const stats = await run({
	format: process.argv.includes("--json") ? "json" : "mitata",
})

if (process.argv.includes("--json")) {
	process.stdout.write(JSON.stringify(stats))
}
