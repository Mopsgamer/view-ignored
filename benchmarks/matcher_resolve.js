import { barplot, bench, run, summary } from "mitata"
import * as fs from "node:fs"

import { resolveSources } from "../out/patterns/resolveSources.js"
import { makeNPM } from "../out/targets/npm.js"
import { unixify } from "../out/unixify.js"

const cwd = unixify(process.cwd())
const target = makeNPM()
const external = new Map()

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

		bench("resolveSources (cached, root)", async () => {
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

		bench("resolveSources (cached, deep)", async () => {
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
	})
})

const stats = await run({
	format: process.argv.includes("--json") ? "json" : "mitata",
})

if (process.argv.includes("--json")) {
	process.stdout.write(JSON.stringify(stats))
}
