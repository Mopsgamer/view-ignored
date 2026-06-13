import { $ } from "bun"
import fs from "node:fs"
import os from "node:os"
import path from "node:path"
import { parseArgs, styleText as c } from "node:util"

const { values, positionals } = parseArgs({
	allowPositionals: true,
	args: Bun.argv.slice(2),
	options: {
		diff: { type: "string" },
		help: { short: "h", type: "boolean" },
		igw: { type: "boolean" },
		node: { type: "boolean" },
		now: { type: "boolean" },
		out: { type: "string" },
		vign: { type: "boolean" },
	},
})

if (values.help) {
	console.log(`${c("bold", "Usage:")} ${c("yellow", "bun scripts/bench.js [options] [files...]")}

${c("bold", "Options:")}
  -h, --help     ${c("dim", "Show this help")}
  --diff <ref>   ${c("dim", "Compare current branch with <ref>")}
  --out <file>   ${c("dim", "Write results to <file>")}
  --now          ${c("dim", "Use synthetic data for table testing")}
  --igw          ${c("dim", "Benchmark ignore-walk only")}
  --vign          ${c("dim", "Benchmark view-ignored only")}
  --node         ${c("dim", "Run benchmarks using Node.js")}
`)
	process.exit(0)
}

const forwardArgs = Bun.argv.slice(2).filter((arg) => {
	if (arg.startsWith("--diff=") || arg === "--diff") return false
	if (arg.startsWith("--out=") || arg === "--out") return false
	if (arg === "-h" || arg === "--help" || arg === "--node" || arg === "--now") return false
	if (positionals.includes(arg)) return false
	return true
})

const benchmarkFiles =
	positionals.length > 0
		? positionals.map((f) => {
				if (f.endsWith(".js") && fs.existsSync(f)) return f
				const withPath = path.join("benchmarks", f.endsWith(".js") ? f : `${f}.js`)
				if (fs.existsSync(withPath)) return withPath
				return f
			})
		: fs
				.readdirSync("benchmarks")
				.filter((f) => f.endsWith(".js"))
				.map((f) => path.join("benchmarks", f))

async function runBenchmarks() {
	const results = []
	const needsTable = values.diff || values.out || values.now

	if (!needsTable) {
		for (const file of benchmarkFiles) {
			console.log(`\nRunning ${file} ${forwardArgs.join(" ")}`)
			try {
				const cmd = values.node
					? $`node --expose-gc ${file} ${forwardArgs}`
					: $`bun --expose-gc ${file} ${forwardArgs}`
				// oxlint-disable-next-line no-await-in-loop
				await cmd
			} catch {
				process.exitCode = 1
			}
		}
		return results
	}

	const extraArgs = ["--json", ...forwardArgs]
	for (const file of benchmarkFiles) {
		process.stderr.write(`Running ${file} ${extraArgs.join(" ")}...\n`)
		try {
			const cmd = values.node
				? $`node --expose-gc ${file} ${extraArgs}`.quiet()
				: $`bun --expose-gc ${file} ${extraArgs}`.quiet()

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

				const fileResults = []
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
								fileResults.push(obj)
							}
						} catch {
							// Skip
						}
					}
				}
				results.push({ file, results: fileResults })
			}

			if (results.length === 0 || results[results.length - 1].results.length === 0) {
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
	for (const group of current) {
		for (const res of group.results) {
			if (!res.benchmarks) continue
			for (const b of res.benchmarks) {
				currentMap.set(b.name || b.alias, { bench: b, file: group.file })
			}
		}
	}

	const baseMap = new Map()
	if (base) {
		for (const group of base) {
			for (const res of group.results) {
				if (!res.benchmarks) continue
				for (const b of res.benchmarks) {
					baseMap.set(b.name || b.alias, b)
				}
			}
		}
	}

	const rows = []
	for (const [name, { bench: curr, file }] of currentMap) {
		// Target the main benchmark stats directly instead of slicing the first raw run array entry
		const currStats = curr.stats
			? getStats(curr.stats.samples || [])
			: getStats(curr.runs?.[0]?.stats?.samples || [])
		if (currStats.sampleCount === 0) continue

		const baseBenchWrapper = baseMap.get(name)
		const baseBench = baseBenchWrapper
			? baseBenchWrapper.stats
				? baseBenchWrapper
				: baseBenchWrapper.runs?.[0]
			: null

		let baseStats = null
		let ratioStr = "0%"
		let emoji = ""
		let diffPercent = 0
		let half = 0
		let isSig = false

		if (baseBench && baseBench.stats && baseBench.stats.samples) {
			baseStats = getStats(baseBench.stats.samples)

			const n1 = currStats.sampleCount
			const n2 = baseStats.sampleCount
			const df = n1 + n2 - 2
			const z = getStatScore95(df)
			const normer = Math.sqrt(1.0 / n1 + 1.0 / n2)
			const sp = Math.sqrt(
				((n1 - 1) * currStats.stdDev ** 2 + (n2 - 1) * baseStats.stdDev ** 2) / Math.max(1, df),
			)
			half = (z * sp * normer * 100) / (baseStats.mean || 1)

			diffPercent = ((currStats.mean - baseStats.mean) * 100) / (baseStats.mean || 1)

			isSig =
				(diffPercent >= 5 && diffPercent - half >= 2) ||
				(diffPercent <= -5 && diffPercent + half <= -2)

			if (diffPercent > 0) {
				if (isSig && diffPercent >= 10) emoji = "💩"
				ratioStr = `+${diffPercent.toFixed(1)}% ± ${half.toFixed(1)}%`
			} else {
				if (isSig && diffPercent <= -10) emoji = "⚡"
				ratioStr = `-${Math.abs(diffPercent).toFixed(1)}% ± ${half.toFixed(1)}%`
			}
		}

		const measurementStr = baseStats
			? `${formatUnit(baseStats.mean)} → ${formatUnit(currStats.mean)} ± ${formatUnit(currStats.stdDev)}`
			: `${formatUnit(currStats.mean)} ± ${formatUnit(currStats.stdDev)}`

		rows.push({
			diffPercent,
			emoji,
			file,
			half,
			isSig,
			measurement: measurementStr,
			name,
			outliers: `${currStats.outliers.toString().padStart(4)} (${Math.round(
				(currStats.outliers * 100) / (currStats.sampleCount || 1),
			)
				.toString()
				.padStart(2)}%)`,
			range: `${formatUnit(currStats.min)} … ${formatUnit(currStats.max)}`,
			ratioStr,
		})
	}
	return rows
}

function getVisualLength(str) {
	const stripped = str.replace(/\x1b\[\d+m/g, "")
	let length = 0
	for (const char of stripped) {
		const codePoint = char.codePointAt(0)
		if (codePoint && (codePoint > 0xffff || codePoint === 0x26a1)) {
			length += 2
		} else {
			length += 1
		}
	}
	return length
}

function getStringLength(str) {
	let length = 0
	for (const char of str) {
		const codePoint = char.codePointAt(0)
		if (codePoint && (codePoint > 0xffff || codePoint === 0x26a1)) {
			length += 2
		} else {
			length += 1
		}
	}
	return length
}

function getTable(rows, isTerminal) {
	if (rows.length === 0) return ""
	const headers = [
		"Benchmark",
		"Measurement (mean \u00b1 std.dev)",
		"Min \u2026 Max",
		"Outliers",
		"Ratio",
	]

	const lengthFn = isTerminal ? getVisualLength : getStringLength

	const colWidths = headers.map((h) => lengthFn(h))

	for (const row of rows) {
		colWidths[0] = Math.max(colWidths[0], lengthFn(row.name))
		colWidths[1] = Math.max(colWidths[1], lengthFn(row.measurement))
		colWidths[2] = Math.max(colWidths[2], lengthFn(row.range))
		colWidths[3] = Math.max(colWidths[3], lengthFn(row.outliers))
		colWidths[4] = Math.max(colWidths[4], lengthFn(`${row.emoji}${row.ratioStr}`))
	}

	const pad = (str, width) => str + " ".repeat(Math.max(0, width - lengthFn(str)))
	const padLeft = (str, width) => " ".repeat(Math.max(0, width - lengthFn(str))) + str

	let out = ""

	const headerLine =
		(
			pad(headers[0], colWidths[0]) +
			"  " +
			padLeft(headers[1], colWidths[1]) +
			"  " +
			padLeft(headers[2], colWidths[2]) +
			"  " +
			padLeft(headers[3], colWidths[3]) +
			"  " +
			padLeft(headers[4], colWidths[4])
		).trimEnd() + "\n"
	const separatorLine =
		(
			"-".repeat(colWidths[0]) +
			"  " +
			"-".repeat(colWidths[1]) +
			"  " +
			"-".repeat(colWidths[2]) +
			"  " +
			"-".repeat(colWidths[3]) +
			"  " +
			"-".repeat(colWidths[4])
		).trimEnd() + "\n"

	out += isTerminal ? c("bold", headerLine) : headerLine
	out += separatorLine

	let lastFile = null
	for (const row of rows) {
		if (lastFile && lastFile !== row.file) {
			out += "\n"
		}
		lastFile = row.file

		let ratio = `${row.emoji}${row.ratioStr}`
		if (isTerminal && row.isSig) {
			if (row.diffPercent >= 5) {
				ratio = c("red", ratio)
			} else if (row.diffPercent <= -5) {
				ratio = c("green", ratio)
			}
		}

		const rowLine =
			(
				pad(row.name, colWidths[0]) +
				"  " +
				padLeft(row.measurement, colWidths[1]) +
				"  " +
				padLeft(row.range, colWidths[2]) +
				"  " +
				padLeft(row.outliers, colWidths[3]) +
				"  " +
				padLeft(ratio, colWidths[4])
			).trimEnd() + "\n"

		out += rowLine
	}

	return out
}

if (values.diff && !values.now) {
	try {
		process.stderr.write(`Building current branch...\n`)
		const build = await $`bun install && bun run prod`.nothrow().quiet()
		if (build.exitCode !== 0) {
			process.stderr.write(`Failed to build current branch\n`)
			process.exit(1)
		}
	} catch (e) {
		process.stderr.write(`Failed to build current branch: ${e}\n`)
		process.exit(1)
	}
}

let currentResults
if (values.now) {
	currentResults = [
		{
			file: "benchmarks/git.js",
			results: [
				{
					benchmarks: [
						{
							name: "test1",
							runs: [{ stats: { samples: [100, 110, 120] } }],
						},
						{
							name: "test-speedup",
							runs: [{ stats: { samples: [50, 55, 60] } }],
						},
						{
							name: "test-slowdown",
							runs: [{ stats: { samples: [200, 210, 220] } }],
						},
					],
				},
			],
		},
	]
} else {
	currentResults = await runBenchmarks()
}

let baseResults = null
if (values.now) {
	baseResults = [
		{
			file: "benchmarks/git.js",
			results: [
				{
					benchmarks: [
						{
							name: "test1",
							runs: [{ stats: { samples: [100, 110, 120] } }],
						},
						{
							name: "test-speedup",
							runs: [{ stats: { samples: [100, 110, 120] } }],
						},
						{
							name: "test-slowdown",
							runs: [{ stats: { samples: [100, 110, 120] } }],
						},
					],
				},
			],
		},
	]
} else if (values.diff) {
	const tmpDir = path.join(os.tmpdir(), `view-ignored-bench-${Date.now()}`)

	try {
		process.stderr.write(`Creating local worktree for ${values.diff}...\n`)
		const worktreeAdd = await $`git worktree add --detach ${tmpDir} ${values.diff}`
			.nothrow()
			.quiet()

		if (worktreeAdd.exitCode !== 0) {
			throw new Error(`Failed to create worktree for ${values.diff}`)
		}

		const worktreeBuild = await $`cd ${tmpDir} && bun install && bun run prod`.nothrow().quiet()

		if (worktreeBuild.exitCode !== 0) {
			throw new Error(`Failed to build worktree for ${values.diff}`)
		}

		const originalFiles = [...benchmarkFiles]
		benchmarkFiles.length = 0
		benchmarkFiles.push(...originalFiles.map((f) => path.join(tmpDir, f)))

		baseResults = await runBenchmarks()

		benchmarkFiles.length = 0
		benchmarkFiles.push(...originalFiles)
	} catch (e) {
		process.stderr.write(`${e.message || e}\n`)
		process.exitCode = 1
	} finally {
		process.stderr.write(`Cleaning up local worktree...\n`)
		await $`git worktree remove --force ${tmpDir}`.nothrow().quiet()
	}
}

const tableRows = compareBenchmarks(currentResults, baseResults)

if (values.out) {
	const fileTable = getTable(tableRows, false)
	fs.writeFileSync(values.out, fileTable)
}

if (values.diff || values.out || values.now) {
	const terminalTable = getTable(tableRows, true)
	process.stdout.write(terminalTable)
}
