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
		process.stderr.write(`Running ${file}...\n`)
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
				process.stderr.write(`No JSON found in output of ${file}\n`)
			}
		} catch (e) {
			process.stderr.write(`Failed to run ${file}: ${e}\n`)
			process.exitCode = 1
			return results
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

function getVisualLength(str) {
	let length = 0
	for (const char of str) {
		const codePoint = char.codePointAt(0)
		if (codePoint && codePoint > 0xffff) {
			length += 2
		} else if (char === "⚡") {
			length += 2
		} else {
			length += 1
		}
	}
	return length
}

function getTable(rows) {
	if (rows.length === 0) return ""
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
		colWidths[0] = Math.max(colWidths[0], getVisualLength(row.name))
		colWidths[1] = Math.max(colWidths[1], getVisualLength(row.measurement))
		colWidths[2] = Math.max(colWidths[2], getVisualLength(row.range))
		colWidths[3] = Math.max(colWidths[3], getVisualLength(row.outliers))
		colWidths[4] = Math.max(colWidths[4], getVisualLength(row.ratio))
	}

	const pad = (str, width) => str + " ".repeat(Math.max(0, width - getVisualLength(str)))
	const padLeft = (str, width) => " ".repeat(Math.max(0, width - getVisualLength(str))) + str

	let out = ""

	const headerLine = headers.map((h, i) => pad(h, colWidths[i])).join("  ") + "\n"
	const separatorLine = colWidths.map((w) => "-".repeat(w)).join("  ") + "\n"

	out += headerLine + separatorLine

	for (const row of rows) {
		const rowLine =
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

		out += rowLine
	}

	return out
}

const currentResults = await runBenchmarks()
let baseResults = null

if (values.diff) {
	const tmpDir = path.join(process.cwd(), `.bench-worktree-${Date.now()}`)

	try {
		process.stderr.write(`Creating local worktree for ${values.diff}...\n`)
		const worktreeAdd = await $`git worktree add --detach ${tmpDir} ${values.diff}`
			.nothrow()
			.quiet()

		if (worktreeAdd.exitCode === 0) {
			await $`cd ${tmpDir} && bun install && bun run prod`.quiet()

			const originalFiles = [...benchmarkFiles]
			benchmarkFiles.length = 0
			benchmarkFiles.push(...originalFiles.map((f) => path.join(tmpDir, f)))

			baseResults = await runBenchmarks()

			benchmarkFiles.length = 0
			benchmarkFiles.push(...originalFiles)
		} else {
			process.stderr.write(`Failed to create worktree for ${values.diff}\n`)
			process.exitCode = 1
		}
	} catch (e) {
		process.stderr.write(`Failed during base benchmark run: ${e}\n`)
		process.exitCode = 1
	} finally {
		process.stderr.write(`Cleaning up local worktree...\n`)
		await $`git worktree remove --force ${tmpDir}`.nothrow().quiet()
	}
}

const tableRows = compareBenchmarks(currentResults, baseResults)
const table = getTable(tableRows)

process.stdout.write(table)
process.stderr.write(table)
