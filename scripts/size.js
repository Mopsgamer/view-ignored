import { $ } from "bun"
import { execSync } from "node:child_process"
import fs from "node:fs"
import os from "node:os"
import path from "node:path"
import { parseArgs } from "node:util"

const { values } = parseArgs({
	args: Bun.argv.slice(2),
	options: {
		diff: { type: "string" },
		now: { type: "boolean" },
		out: { type: "string" },
	},
})

function parseSizeToBytes(sizeStr) {
	const match = sizeStr.trim().match(/^([\d.]+)\s*([a-zA-Z]+)$/)
	if (!match) return 0
	const val = parseFloat(match[1])
	const unit = match[2].toUpperCase()
	switch (unit) {
		case "B":
			return val
		case "KB":
			return val * 1024
		case "MB":
			return val * 1024 * 1024
		case "GB":
			return val * 1024 * 1024 * 1024
		default:
			return val
	}
}

function formatBytes(bytes) {
	if (Math.abs(bytes) === 0) return "0 B"
	const k = 1024
	const sizes = ["B", "KB", "MB", "GB"]
	const i = Math.floor(Math.log(Math.abs(bytes)) / Math.log(k))
	return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`
}

function formatSizeDiff(diff, baseVal) {
	if (diff === 0) return "0 B (0%)"
	const pct = baseVal ? (diff * 100) / baseVal : 0
	const sign = diff > 0 ? "+" : ""
	return `${sign}${formatBytes(diff)} (${sign}${pct.toFixed(2)}%)`
}

function formatFileDiff(diff, baseVal) {
	if (diff === 0) return "0 (0%)"
	const pct = baseVal ? (diff * 100) / baseVal : 0
	const sign = diff > 0 ? "+" : ""
	return `${sign}${diff} (${sign}${pct.toFixed(2)}%)`
}

function padRight(str, len) {
	return str + " ".repeat(Math.max(0, len - str.length))
}

function getPackageSize(dir) {
	try {
		const stdout = execSync("bun pm pack", {
			cwd: dir,
			encoding: "utf8",
			stdio: ["ignore", "pipe", "ignore"],
		})

		const files = fs.readdirSync(dir)
		for (const file of files) {
			if (file.startsWith("view-ignored-") && file.endsWith(".tgz")) {
				fs.unlinkSync(path.join(dir, file))
			}
		}

		const totalFilesMatch = stdout.match(/Total files:\s*(\d+)/i)
		const unpackedSizeMatch = stdout.match(/Unpacked size:\s*([\d.]+\s*[a-zA-Z]+)/i)
		const packedSizeMatch = stdout.match(/Packed size:\s*([\d.]+\s*[a-zA-Z]+)/i)

		return {
			packedBytes: packedSizeMatch ? parseSizeToBytes(packedSizeMatch[1]) : 0,
			packedSizeStr: packedSizeMatch ? packedSizeMatch[1] : "0B",
			totalFiles: totalFilesMatch ? parseInt(totalFilesMatch[1], 10) : 0,
			unpackedBytes: unpackedSizeMatch ? parseSizeToBytes(unpackedSizeMatch[1]) : 0,
			unpackedSizeStr: unpackedSizeMatch ? unpackedSizeMatch[1] : "0B",
		}
	} catch (e) {
		process.stderr.write(`Failed to run bun pm pack in ${dir}: ${e}\n`)
		return null
	}
}

function getPackageSizeTable(current, base) {
	const headers = ["Item", "Current", "Base", "Change"]
	const rows = [
		[
			"Total Files",
			current.totalFiles.toString(),
			base ? base.totalFiles.toString() : "-",
			base ? formatFileDiff(current.totalFiles - base.totalFiles, base.totalFiles) : "-",
		],
		[
			"Unpacked Size",
			current.unpackedSizeStr,
			base ? base.unpackedSizeStr : "-",
			base ? formatSizeDiff(current.unpackedBytes - base.unpackedBytes, base.unpackedBytes) : "-",
		],
		[
			"Packed Size",
			current.packedSizeStr,
			base ? base.packedSizeStr : "-",
			base ? formatSizeDiff(current.packedBytes - base.packedBytes, base.packedBytes) : "-",
		],
	]

	const colWidths = headers.map((h, idx) => {
		let maxLen = h.length
		for (const row of rows) {
			maxLen = Math.max(maxLen, row[idx].length)
		}
		return maxLen
	})

	const headerLine = headers
		.map((h, idx) => padRight(h, colWidths[idx]))
		.join("  ")
		.trimEnd()
	const separatorLine = colWidths.map((w) => "-".repeat(w)).join("  ")
	const rowLines = rows.map((row) => {
		return row
			.map((val, idx) => padRight(val, colWidths[idx]))
			.join("  ")
			.trimEnd()
	})

	return [headerLine, separatorLine, ...rowLines].join("\n")
}

async function main() {
	let currentSize = null
	let baseSize = null

	if (values.now) {
		currentSize = {
			packedBytes: 38225,
			packedSizeStr: "37.33KB",
			totalFiles: 95,
			unpackedBytes: 162998,
			unpackedSizeStr: "159.18KB",
		}
		baseSize = {
			packedBytes: 38225,
			packedSizeStr: "37.33KB",
			totalFiles: 95,
			unpackedBytes: 162998,
			unpackedSizeStr: "159.18KB",
		}
	} else {
		currentSize = getPackageSize(process.cwd())

		if (values.diff) {
			const tmpDir = path.join(os.tmpdir(), `view-ignored-size-${Date.now()}`)
			try {
				process.stderr.write(`Creating local worktree for size comparison at ${values.diff}...\n`)
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

				baseSize = getPackageSize(tmpDir)
			} catch (e) {
				process.stderr.write(`${e.message || e}\n`)
				process.exitCode = 1
			} finally {
				process.stderr.write(`Cleaning up local worktree...\n`)
				await $`git worktree remove --force ${tmpDir}`.nothrow().quiet()
			}
		}
	}

	if (!currentSize) {
		process.exit(1)
	}

	const sizeTable = getPackageSizeTable(currentSize, baseSize)
	const report = `## Package Size Regression Report\n\n\`\`\`txt\n${sizeTable}\`\`\`\n`

	if (values.out) {
		fs.writeFileSync(values.out, report)
	}

	process.stdout.write(report)
}

main().catch((e) => {
	console.error(e)
	process.exit(1)
})
