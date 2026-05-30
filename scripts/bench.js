import { $ } from "bun"
import fs from "node:fs"
import path from "node:path"
import { parseArgs } from "node:util"

const { values, positionals } = parseArgs({
	allowPositionals: true,
	args: Bun.argv.slice(2),
	options: {
		diff: { type: "string" },
		help: { short: "h", type: "boolean" },
		igw: { type: "boolean" },
		node: { type: "boolean" },
		vign: { type: "boolean" },
	},
})

if (values.help) {
	console.log(`Usage: bun scripts/bench.js [options] [files...]

Options:
  -h, --help     Show this help
  --diff <ref>   Compare current branch with <ref>
  --vign         Benchmark view-ignored only
  --igw          Benchmark ignore-walk only
  --node         Run benchmarks using Node.js
`)
	process.exit(0)
}

const benchmarkFiles =
	positionals.length > 0
		? positionals
		: fs
				.readdirSync("benchmarks")
				.filter((f) => f.endsWith(".js") && !f.includes("Init"))
				.map((f) => path.join("benchmarks", f))

async function runBenchmarks() {
	const results = []
	const extraArgs = ["--json"]
	if (values.vign) extraArgs.push("--vign")
	if (values.igw) extraArgs.push("--igw")

	for (const file of benchmarkFiles) {
		console.error(`Running ${file}...`)
		try {
			const cmd = values.node
				? $`node --expose-gc ${file} ${extraArgs}`
				: $`bun ${file} ${extraArgs}`

			// oxlint-disable-next-line no-await-in-loop
			const out = await cmd.text()
			const startIdx = out.indexOf('{"layout":')
			if (startIdx !== -1) {
				const jsonContent = out.substring(startIdx)
				const regex = /\{"layout":/g
				let match
				const indices = []
				while ((match = regex.exec(jsonContent)) !== null) {
					indices.push(match.index)
				}

				for (let i = 0; i < indices.length; i++) {
					const start = indices[i]
					const end = i + 1 < indices.length ? indices[i + 1] : jsonContent.length
					const chunk = jsonContent.substring(start, end).trim()

					let braceCount = 0
					let actualEnd = -1
					for (let j = 0; j < chunk.length; j++) {
						if (chunk[j] === "{") braceCount++
						else if (chunk[j] === "}") {
							braceCount--
							if (braceCount === 0) {
								actualEnd = j
								break
							}
						}
					}

					if (actualEnd !== -1) {
						try {
							const obj = JSON.parse(chunk.substring(0, actualEnd + 1))
							if (obj.benchmarks) {
								results.push(obj)
							}
						} catch {
							// Skip
						}
					}
				}
			}

			if (results.length === 0) {
				console.error(`No JSON found in output of ${file}`)
			}
		} catch (e) {
			console.error(`Failed to run ${file}:`, e)
		}
	}
	return results
}

function getStats(samples) {
	samples.sort((a, b) => a - b)
	const n = samples.length
	const mean = samples.reduce((a, b) => a + b, 0) / n
	const sqDiff = samples.map((x) => (x - mean) ** 2)
	const stdDev = Math.sqrt(sqDiff.reduce((a, b) => a + b, 0) / Math.max(1, n - 1)) || 0

	const q1 = samples[Math.floor(n * 0.25)] || 0
	const q3 = samples[Math.floor(n * 0.75)] || 0
	const iqr = q3 - q1
	const low = q1 - 1.5 * iqr
	const high = q3 + 1.5 * iqr
	const outliers = samples.filter((x) => x < low || x > high).length

	return {
		max: samples[n - 1] || 0,
		mean,
		min: samples[0] || 0,
		outliers,
		sampleCount: n,
		stdDev,
	}
}

function formatUnit(ns) {
	if (ns < 1) return `${(ns * 1000).toFixed(2)} ps`
	if (ns < 1000) return `${ns.toFixed(2)} ns`
	if (ns < 1000000) return `${(ns / 1000).toFixed(2)} µs`
	if (ns < 1000000000) return `${(ns / 1000000).toFixed(2)} ms`
	return `${(ns / 1000000000).toFixed(2)} s`
}

function getStatScore95(df) {
	if (df <= 0) return 12.706
	if (df === 1) return 12.706
	if (df === 2) return 4.303
	if (df === 3) return 3.182
	if (df === 4) return 2.776
	if (df === 5) return 2.571
	if (df === 10) return 2.228
	if (df === 20) return 2.086
	if (df === 30) return 2.042
	if (df === 60) return 2.0
	if (df === 120) return 1.98
	return 1.96
}

function compareBenchmarks(current, base) {
	const currentMap = new Map()
	for (const res of current) {
		if (!res.benchmarks) continue
		for (const b of res.benchmarks) {
			currentMap.set(b.name || b.alias, b)
		}
	}

	const baseMap = new Map()
	if (base) {
		for (const res of base) {
			if (!res.benchmarks) continue
			for (const b of res.benchmarks) {
				baseMap.set(b.name || b.alias, b)
			}
		}
	}

	const rows = []
	for (const [name, curr] of currentMap) {
		const currBench = curr.runs ? curr.runs[0] : curr
		if (!currBench || !currBench.stats || !currBench.stats.samples) continue

		const currStats = getStats(currBench.stats.samples)
		const baseBenchWrapper = baseMap.get(name)
		const baseBench = baseBenchWrapper
			? baseBenchWrapper.runs
				? baseBenchWrapper.runs[0]
				: baseBenchWrapper
			: null

		let ratioStr = "0%"
		let emoji = "  "

		if (baseBench && baseBench.stats && baseBench.stats.samples) {
			const baseStats = getStats(baseBench.stats.samples)

			const n1 = currStats.sampleCount
			const n2 = baseStats.sampleCount
			const df = n1 + n2 - 2
			const z = getStatScore95(df)
			const normer = Math.sqrt(1.0 / n1 + 1.0 / n2)
			const sp = Math.sqrt(
				((n1 - 1) * currStats.stdDev ** 2 + (n2 - 1) * baseStats.stdDev ** 2) / Math.max(1, df),
			)
			const half = (z * sp * normer * 100) / (baseStats.mean || 1)

			const diffPercent = ((currStats.mean - baseStats.mean) * 100) / (baseStats.mean || 1)

			const isSig =
				(diffPercent >= 1 && diffPercent - half >= 1) ||
				(diffPercent <= -1 && diffPercent + half <= -1)

			if (diffPercent > 0) {
				if (isSig && diffPercent >= 5) emoji = "💩"
				ratioStr = `+${diffPercent.toFixed(1)}% ± ${half.toFixed(1)}%`
			} else {
				if (isSig && diffPercent <= -5) emoji = "⚡"
				ratioStr = `-${Math.abs(diffPercent).toFixed(1)}% ± ${half.toFixed(1)}%`
			}
		}

		rows.push({
			measurement: `${formatUnit(currStats.mean)} ± ${formatUnit(currStats.stdDev)}`,
			name,
			outliers: `${currStats.outliers.toString().padStart(4)} (${Math.round(
				(currStats.outliers * 100) / (currStats.sampleCount || 1),
			)
				.toString()
				.padStart(2)}%)`,
			range: `${formatUnit(currStats.min)} … ${formatUnit(currStats.max)}`,
			ratio: `${emoji} ${ratioStr}`,
		})
	}
	return rows
}

function printTable(rows) {
	if (rows.length === 0) return
	const headers = [
		"Benchmark",
		"Measurement (mean \u00b1 std.dev)",
		"Min \u2026 Max",
		"Outliers",
		"Ratio",
	]
	const colWidths = [
		headers[0].length,
		headers[1].length,
		headers[2].length,
		headers[3].length,
		headers[4].length,
	]

	for (const row of rows) {
		colWidths[0] = Math.max(colWidths[0], row.name.length)
		colWidths[1] = Math.max(colWidths[1], row.measurement.length)
		colWidths[2] = Math.max(colWidths[2], row.range.length)
		colWidths[3] = Math.max(colWidths[3], row.outliers.length)
		colWidths[4] = Math.max(colWidths[4], row.ratio.length)
	}

	const pad = (str, width) => str.padEnd(width)
	const padLeft = (str, width) => str.padStart(width)

	let out = "```text\n"
	out += headers.map((h, i) => pad(h, colWidths[i])).join("  ") + "\n"
	out += colWidths.map((w) => "-".repeat(w)).join("  ") + "\n"

	for (const row of rows) {
		out +=
			pad(row.name, colWidths[0]) +
			"  " +
			padLeft(row.measurement, colWidths[1]) +
			"  " +
			padLeft(row.range, colWidths[2]) +
			"  " +
			padLeft(row.outliers, colWidths[3]) +
			"  " +
			pad(row.ratio, colWidths[4]) +
			"\n"
	}
	out += "```"
	process.stdout.write(out + "\n")
}

const currentResults = await runBenchmarks()
let baseResults = null

if (values.diff) {
	const currentBranch = (await $`git branch --show-current`.quiet().text()).trim()
	const isDirty = (await $`git status --porcelain`.quiet().text()).trim().length > 0

	if (isDirty) {
		await $`git stash`.quiet()
	}

	try {
		await $`git checkout ${values.diff}`.quiet()
		await $`bun install && bun run prod`.quiet()
		baseResults = await runBenchmarks()
	} finally {
		if (currentBranch) {
			await $`git checkout ${currentBranch}`.quiet()
		} else {
			await $`git checkout -`.quiet()
		}

		if (isDirty) {
			const popResult = await $`git stash pop`.nothrow().quiet()

			if (popResult.exitCode !== 0) {
				console.error(
					"\n❌ Conflict detected during git stash pop! Aborting and resetting working directory.",
				)

				await $`git reset --hard stash@{0}`.quiet()
				process.exit(1)
			}
		}
		await $`bun install && bun run prod`.quiet()
	}
}

const tableRows = compareBenchmarks(currentResults, baseResults)
printTable(tableRows)
