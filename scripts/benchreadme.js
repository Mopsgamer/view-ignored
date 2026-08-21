import { $ } from "bun"
import fs from "node:fs"

const README_PATH = "benchmarks/README.md"

function cleanLine(line) {
	let clean = line.replace(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d+Z\s?/, "")
	clean = clean.replace(
		/[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g,
		"",
	)
	return clean
}

function getRuntime(lines, startIdx) {
	for (let j = startIdx; j < Math.min(lines.length, startIdx + 15); j++) {
		if (lines[j].includes("runtime: node")) return "node"
		if (lines[j].includes("runtime: bun")) return "bun"
	}
	return null
}

function extractBenchmarksFromLog(logText) {
	const lines = logText.split(/\r?\n/).map(cleanLine)

	let nodeBlock = []
	let bunBlock = []

	for (let i = 0; i < lines.length; i++) {
		if (lines[i].includes("Git target benchmark")) {
			const runtime = getRuntime(lines, i)
			if (!runtime) continue

			const block = []
			for (let k = i; k < lines.length; k++) {
				const l = lines[k]
				if (k > i && l.includes("Git target benchmark")) {
					break
				}
				if (l.startsWith("##[") || l.includes("Post Run") || l.includes("Complete job")) {
					break
				}
				if (
					l.includes("Post job cleanup") ||
					l.startsWith("[command]") ||
					l.includes("Cleaning up orphan processes") ||
					l.startsWith("Post ")
				) {
					break
				}
				block.push(l)
			}

			if (runtime === "node") {
				nodeBlock = block
			} else if (runtime === "bun") {
				bunBlock = block
			}
		}
	}

	return {
		bun: bunBlock.join("\n").trim(),
		node: nodeBlock.join("\n").trim(),
	}
}

function ensureMarkers(content) {
	if (content.includes("<!-- BENCH_NODE_START -->")) {
		return content
	}

	let newContent = content

	const nodeMatch = newContent.match(/(### Node\s*\r?\n\s*)(```txt[\s\S]*?```)/)
	if (nodeMatch) {
		newContent = newContent.replace(
			nodeMatch[0],
			`${nodeMatch[1]}<!-- BENCH_NODE_START -->\n${nodeMatch[2]}\n<!-- BENCH_NODE_END -->`,
		)
	}

	const bunMatch = newContent.match(/(### Bun\s*\r?\n\s*)(```txt[\s\S]*?```)/)
	if (bunMatch) {
		newContent = newContent.replace(
			bunMatch[0],
			`${bunMatch[1]}<!-- BENCH_BUN_START -->\n${bunMatch[2]}\n<!-- BENCH_BUN_END -->`,
		)
	}

	const nodeLowMatch = newContent.match(
		/(<!-- BENCH_NODE_END -->[\s\S]*?#### Low-end\s*\r?\n\s*)(```txt[\s\S]*?```)/,
	)
	if (nodeLowMatch) {
		newContent = newContent.replace(
			nodeLowMatch[0],
			`${nodeLowMatch[1]}<!-- BENCH_NODE_LOW_START -->\n${nodeLowMatch[2]}\n<!-- BENCH_NODE_LOW_END -->`,
		)
	}

	const bunLowMatch = newContent.match(
		/(<!-- BENCH_BUN_END -->[\s\S]*?#### Low-end\s*\r?\n\s*)(```txt[\s\S]*?```)/,
	)
	if (bunLowMatch) {
		newContent = newContent.replace(
			bunLowMatch[0],
			`${bunLowMatch[1]}<!-- BENCH_BUN_LOW_START -->\n${bunLowMatch[2]}\n<!-- BENCH_BUN_LOW_END -->`,
		)
	}

	return newContent
}

function updateSection(content, startMarker, endMarker, newBlock) {
	const startIndex = content.indexOf(startMarker)
	const endIndex = content.indexOf(endMarker)
	if (startIndex === -1 || endIndex === -1) {
		return content
	}

	const prefix = content.substring(0, startIndex + startMarker.length)
	const suffix = content.substring(endIndex)

	return `${prefix}\n\`\`\`txt\n${newBlock}\n\`\`\`\n${suffix}`
}

function splitBenchmarks(stdout) {
	const lines = stdout.split(/\r?\n/).map(cleanLine)
	const sections = []
	let currentSection = []

	for (const line of lines) {
		const isNewSection =
			(line.includes("target benchmark") || line.includes("Init benchmark")) &&
			!line.includes("You can use") &&
			!line.startsWith("Running ")

		if (isNewSection) {
			if (currentSection.length > 0) {
				sections.push(currentSection.join("\n"))
			}
			currentSection = [line]
		} else {
			currentSection.push(line)
		}
	}
	if (currentSection.length > 0) {
		sections.push(currentSection.join("\n"))
	}
	return sections
}

function parseBenchmark(lines, j) {
	const line = lines[j]
	if (!line.includes("/iter") && !line.includes("µs/iter") && !line.includes("ms/iter")) return null

	const searchIdx = line.search(/\s+\d/)
	if (searchIdx === -1) return null

	const name = line.substring(0, searchIdx).trim()
	let timeRange = ""
	let memRange = ""
	let memAvg = ""

	let offset = 1
	if (j + offset < lines.length && /^\s+\(/.test(lines[j + offset])) {
		const timeRangeLine = lines[j + offset]
		const timeRangeMatch = timeRangeLine.match(/\(([^)]+)\)/)
		if (timeRangeMatch) timeRange = timeRangeMatch[1].replace(/\s+/g, " ").trim()
		offset++
	}
	if (j + offset < lines.length && /^\s+\(/.test(lines[j + offset])) {
		const memRangeLine = lines[j + offset]
		const memRangeMatch = memRangeLine.match(/\(([^)]+)\)/)
		if (memRangeMatch) memRange = memRangeMatch[1].replace(/\s+/g, " ").trim()
		const idx = memRangeLine.indexOf(")")
		if (idx !== -1) {
			const after = memRangeLine.substring(idx + 1).trim()
			const memAvgMatch = after.match(/^(\d+(?:\.\d+)?\s*[a-zA-Z]+)/)
			if (memAvgMatch) memAvg = memAvgMatch[1].trim()
		}
		offset++
	}

	return { memAvg, memRange, name, timeRange }
}

function formatBenchmarkOutput(stdout, commandHeader) {
	const rawSections = splitBenchmarks(stdout)

	const formattedSections = rawSections.map((section) => {
		const lines = section.split(/\r?\n/).map(cleanLine)

		const clk = lines.find((l) => l.startsWith("clk:"))
		const cpu = lines.find((l) => l.startsWith("cpu:"))
		const runtime = lines.find((l) => l.startsWith("runtime:"))
		const [title] = lines

		const benchmarks = []
		for (let j = 0; j < lines.length; j++) {
			const parsed = parseBenchmark(lines, j)
			if (parsed) benchmarks.push(parsed)
		}

		const barplotLines = []
		let inBarplot = false
		for (const line of lines) {
			if (line.includes("┌")) {
				inBarplot = true
				barplotLines.push(line)
				continue
			}
			if (inBarplot) {
				barplotLines.push(line)
				if (line.includes("┘")) {
					inBarplot = false
				}
			}
		}

		const summaryLines = []
		let inSummary = false
		for (const line of lines) {
			if (line.trim() === "summary") {
				inSummary = true
				summaryLines.push(line)
				continue
			}
			if (inSummary) {
				if (line.trim() === "" || line.includes("target benchmark")) {
					inSummary = false
				} else {
					summaryLines.push(line)
				}
			}
		}

		const outLines = []
		if (title) outLines.push(title)
		if (clk) outLines.push(clk)
		if (cpu) outLines.push(cpu)
		if (runtime) outLines.push(runtime)

		const hasMemory = benchmarks.some((b) => b.memAvg || b.memRange)
		if (hasMemory) {
			outLines.push("\nMemory Usage:")
			const maxNameLen = Math.max(...benchmarks.map((b) => b.name.length))
			for (const b of benchmarks) {
				if (b.memAvg || b.memRange) {
					const paddedName = b.name.padEnd(maxNameLen)
					const avgStr = b.memAvg ? `Avg: ${b.memAvg}` : ""
					const rangeStr = b.memRange ? `Range: ${b.memRange}` : ""
					outLines.push(`  ${paddedName}   ${avgStr.padEnd(15)} ${rangeStr}`)
				}
			}
		}

		if (barplotLines.length > 0) {
			outLines.push("")
			outLines.push(...barplotLines)
		}

		if (summaryLines.length > 0) {
			outLines.push("")
			outLines.push(...summaryLines)
		}

		return outLines.join("\n")
	})

	return [commandHeader, ...formattedSections].join("\n\n").trim()
}

async function remote(o) {
	const token = process.env.GITHUB_TOKEN
	let remoteNode = null
	let remoteBun = null
	if (!token) {
		console.warn(
			"Warning: GITHUB_TOKEN environment variable is not set. Skipping remote benchmark updates.",
		)
		return
	}

	console.log("Fetching latest run of benchmark.yml workflow...")
	try {
		const headers = {
			Accept: "application/vnd.github.v3+json",
			Authorization: `token ${token}`,
			"User-Agent": "view-ignored-benchreadme",
		}

		const runsRes = await fetch(
			"https://api.github.com/repos/Mopsgamer/view-ignored/actions/workflows/benchmark.yml/runs?status=success&per_page=1",
			{ headers },
		)

		if (!runsRes.ok) {
			throw new Error(`Failed to list workflow runs: ${runsRes.statusText}`)
		}

		const runsData = await runsRes.json()
		const run = runsData.workflow_runs?.[0]

		if (!run) {
			throw new Error("No successful runs found for benchmark.yml")
		}

		console.log(`Found successful run ID ${run.id}. Fetching jobs...`)
		const jobsRes = await fetch(run.jobs_url, { headers })

		if (!jobsRes.ok) {
			throw new Error(`Failed to fetch jobs: ${jobsRes.statusText}`)
		}

		const jobsData = await jobsRes.json()
		const job = jobsData.jobs?.find((j) => j.name === "benchmark")

		if (!job) {
			throw new Error("Could not find job 'benchmark' in workflow run")
		}

		console.log(`Found job ID ${job.id}. Fetching raw log output...`)
		const logRes = await fetch(
			`https://api.github.com/repos/Mopsgamer/view-ignored/actions/jobs/${job.id}/logs`,
			{ headers },
		)

		if (!logRes.ok) {
			throw new Error(`Failed to fetch job log: ${logRes.statusText}`)
		}

		const logText = await logRes.text()
		console.log("Parsing remote benchmark logs...")
		const remoteResults = extractBenchmarksFromLog(logText)

		if (remoteResults.node) {
			remoteNode = formatBenchmarkOutput(
				remoteResults.node,
				"$ node --expose-gc benchmarks/git.js && node --expose-gc benchmarks/npm.js",
			)
			console.log("Successfully parsed remote Node.js benchmark.")
		} else {
			console.warn("Could not find remote Node.js benchmark in logs.")
		}

		if (remoteResults.bun) {
			remoteBun = formatBenchmarkOutput(
				remoteResults.bun,
				"$ bun run --expose-gc benchmarks/git.js && bun run --expose-gc benchmarks/npm.js",
			)
			console.log("Successfully parsed remote Bun benchmark.")
		} else {
			console.warn("Could not find remote Bun benchmark in logs.")
		}
	} catch (err) {
		console.error("Error fetching/parsing remote benchmarks:", err.message || err)
	}
	o.readmeContent = updateSection(
		o.readmeContent,
		"<!-- BENCH_NODE_START -->",
		"<!-- BENCH_NODE_END -->",
		remoteNode,
	)
	o.readmeContent = updateSection(
		o.readmeContent,
		"<!-- BENCH_BUN_START -->",
		"<!-- BENCH_BUN_END -->",
		remoteBun,
	)
}

async function local(o) {
	console.log("Building view-ignored...")
	if (!process.argv.includes("--no-build")) await $`bun run prod`.quiet()
	console.log("Running local Node.js benchmarks (Low-end)...")
	const localNodeStdout = await $`bun run bench target_git target_npm --node`.text()
	const localNode = formatBenchmarkOutput(
		localNodeStdout,
		"$ node --expose-gc benchmarks/git.js && node --expose-gc benchmarks/npm.js",
	)

	console.log("Running local Bun benchmarks (Low-end)...")
	const localBunStdout = await $`bun run bench target_git target_npm`.text()
	const localBun = formatBenchmarkOutput(
		localBunStdout,
		"$ bun run --expose-gc benchmarks/git.js && bun run --expose-gc benchmarks/npm.js",
	)

	o.readmeContent = updateSection(
		o.readmeContent,
		"<!-- BENCH_NODE_LOW_START -->",
		"<!-- BENCH_NODE_LOW_END -->",
		localNode,
	)
	o.readmeContent = updateSection(
		o.readmeContent,
		"<!-- BENCH_BUN_LOW_START -->",
		"<!-- BENCH_BUN_LOW_END -->",
		localBun,
	)
}

async function main() {
	if (process.argv.includes("-h") || process.argv.includes("--help")) {
		console.log("Updates benchmarks/README.md")
		console.log("Options: --remote and --local. None for both.")
		return
	}
	const o = { readmeContent: "" }
	try {
		o.readmeContent = fs.readFileSync(README_PATH, "utf8")
	} catch (err) {
		console.error(`Could not read ${README_PATH}:`, err)
		process.exit(1)
	}

	o.readmeContent = ensureMarkers(o.readmeContent)

	if (!process.argv.includes("--remote")) {
		await local(o)
	}
	if (!process.argv.includes("--local")) {
		await remote(o)
	}
	await Bun.$`bun run fmt benchmarks/README.md`

	try {
		fs.writeFileSync(README_PATH, o.readmeContent, "utf8")
		console.log(`Successfully updated ${README_PATH}`)
	} catch (err) {
		console.error(`Could not write to ${README_PATH}:`, err)
		process.exit(1)
	}
}

main().catch((err) => {
	console.error(err)
	process.exit(1)
})
