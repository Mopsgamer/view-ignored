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

function formatBenchmarkOutput(stdout, commandHeader) {
	const lines = stdout.split(/\r?\n/).map(cleanLine)
	const filtered = lines.filter((line) => !line.startsWith("Running benchmarks/"))
	return [commandHeader, ...filtered].join("\n").trim()
}

async function main() {
	console.log("Building view-ignored...")
	await $`bun run prod`.quiet()

	let readmeContent = ""
	try {
		readmeContent = fs.readFileSync(README_PATH, "utf8")
	} catch (err) {
		console.error(`Could not read ${README_PATH}:`, err)
		process.exit(1)
	}

	readmeContent = ensureMarkers(readmeContent)

	const token = process.env.GITHUB_TOKEN
	let remoteNode = null
	let remoteBun = null

	if (token) {
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
	} else {
		console.warn(
			"Warning: GITHUB_TOKEN environment variable is not set. Skipping remote benchmark updates.",
		)
	}

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

	if (remoteNode) {
		readmeContent = updateSection(
			readmeContent,
			"<!-- BENCH_NODE_START -->",
			"<!-- BENCH_NODE_END -->",
			remoteNode,
		)
	}
	if (remoteBun) {
		readmeContent = updateSection(
			readmeContent,
			"<!-- BENCH_BUN_START -->",
			"<!-- BENCH_BUN_END -->",
			remoteBun,
		)
	}
	readmeContent = updateSection(
		readmeContent,
		"<!-- BENCH_NODE_LOW_START -->",
		"<!-- BENCH_NODE_LOW_END -->",
		localNode,
	)
	readmeContent = updateSection(
		readmeContent,
		"<!-- BENCH_BUN_LOW_START -->",
		"<!-- BENCH_BUN_LOW_END -->",
		localBun,
	)

	try {
		fs.writeFileSync(README_PATH, readmeContent, "utf8")
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
