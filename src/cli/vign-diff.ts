#!/usr/bin/env node
import type { MatcherContext } from "../patterns/matcherContext.js"
import type { Target } from "../targets/target.js"

import { execSync, spawn } from "node:child_process"
import { readFileSync, unlinkSync, existsSync } from "node:fs"
import { join } from "node:path"
import { performance } from "node:perf_hooks"
import { parseArgs, styleText, stripVTControlCharacters } from "node:util"
import { gunzipSync } from "node:zlib"

import pkg from "../../package.json" with { type: "json" }
import { RuleMatchKind, type RuleMatch } from "../patterns/rule.js"
import { scan } from "../scan.js"
import {
	makeGit,
	makeNPM,
	makeBun,
	makeVSCE,
	makeDeno,
	makeJSR,
	makeYarn,
	makeYarnClassic,
} from "../targets/index.js"

interface TargetDef {
	bin: string
	cmd: string
	make: () => Target
	parse: (out: string) => string[]
}

const TARGETS: Record<string, TargetDef> = {
	bun: {
		bin: "bun",
		cmd: "bun pm pack --dry-run",
		make: makeBun,
		parse: (out) => {
			const files: string[] = []
			for (const line of out.split(/\r?\n/)) {
				const match = line.match(/^packed\s+\S+\s+(.+)$/)
				if (match?.[1]) files.push(match[1].trim())
			}
			return files
		},
	},
	deno: {
		bin: "deno",
		cmd: "deno publish --dry-run --allow-dirty --allow-slow-types",
		make: makeDeno,
		parse: (out) => {
			const files: string[] = []
			let inFiles = false
			for (const line of out.split(/\r?\n/)) {
				if (line.includes("Simulating publish") && line.includes("with files:")) {
					inFiles = true
					continue
				}
				if (inFiles && !line.startsWith("   file:///")) {
					if (line.trim() === "") continue
					break
				}
				if (inFiles) {
					const match = line.match(/   file:\/\/\/\S+\/([^\s()]+)/)
					if (match?.[1]) files.push(match[1])
				}
			}
			return files
		},
	},
	git: {
		bin: "git",
		cmd: "git ls-files --others --exclude-standard --cached",
		make: makeGit,
		parse: (out) => out.trim().split(/\r?\n/).filter(Boolean),
	},
	jsr: {
		bin: "jsr",
		cmd: "jsr publish --dry-run --allow-dirty --allow-slow-types",
		make: makeJSR,
		parse: (out) => {
			const files: string[] = []
			let inFiles = false
			for (const line of out.split(/\r?\n/)) {
				if (line.includes("Simulating publish") && line.includes("with files:")) {
					inFiles = true
					continue
				}
				if (inFiles && !line.startsWith("   file:///")) {
					if (line.trim() === "") continue
					break
				}
				if (inFiles) {
					const match = line.match(/   file:\/\/\/\S+\/([^\s()]+)/)
					if (match?.[1]) files.push(match[1])
				}
			}
			return files
		},
	},
	npm: {
		bin: "npm",
		cmd: "npm pack --dry-run",
		make: makeNPM,
		parse: (out) => {
			const files: string[] = []
			let inContents = false
			for (const line of out.split(/\r?\n/)) {
				if (line.includes("Tarball Contents")) {
					inContents = true
					continue
				}
				if (inContents && line.includes("Tarball Details")) break
				if (inContents) {
					const match = line.match(/npm notice\s+\S+\s+(.+)/)
					if (match?.[1]) files.push(match[1].trim())
				}
			}
			return files
		},
	},
	vsce: {
		bin: "vsce",
		cmd: "vsce ls",
		make: makeVSCE,
		parse: (out) =>
			out
				.trim()
				.split(/\r?\n/)
				.filter(
					(line) =>
						line &&
						!line.startsWith("npm notice") &&
						!line.includes("DeprecationWarning") &&
						!line.startsWith("ERROR"),
				)
				.filter(Boolean),
	},
	yarn: {
		bin: "yarn",
		cmd: "yarn pack --dry-run",
		make: makeYarn,
		parse: (out) => {
			const files: string[] = []
			for (const line of out.split(/\r?\n/)) {
				const match = line.match(/^- (.*)$/)
				if (match?.[1]) files.push(match[1].trim())
			}
			return files
		},
	},
	"yarn-classic": {
		bin: "yarn",
		cmd: "yarn pack --filename .vign-diff.tgz",
		make: makeYarnClassic,
		parse: () => {
			const files: string[] = []
			try {
				const data = readFileSync(".vign-diff.tgz")
				const buffer = gunzipSync(data)
				let offset = 0
				while (offset + 512 <= buffer.length) {
					const name = buffer
						.subarray(offset, offset + 100)
						.toString()
						.replace(/\0/g, "")
					if (!name) break
					const typeflag = buffer[offset + 156]
					offset += 512
					const sizeStr = buffer.subarray(offset - 512 + 124, offset - 512 + 124 + 12).toString()
					const size = parseInt(sizeStr, 8)
					// typeflag '5' (0x35) is directory
					if (
						typeflag !== 0x35 &&
						name !== "package/" &&
						name !== "package" &&
						!name.endsWith("/")
					) {
						files.push(name.replace(/^package\//, ""))
					}
					offset += Math.ceil(size / 512) * 512
				}
			} finally {
				try {
					unlinkSync(".vign-diff.tgz")
				} catch {}
			}
			return files
		},
	},
}

const UNSUPPORTED: string[] = []

interface Diff {
	file: string
	issue: string
	match: RuleMatch
}

function fmtTime(ms: number): string {
	if (ms < 1) return styleText("cyan", `${(ms * 1000).toFixed(2)}µs`)
	if (ms < 1000) return styleText("cyan", `${ms.toFixed(2)}ms`)
	return styleText("cyan", `${(ms / 1000).toFixed(2)}s`)
}

function openUrl(url: string) {
	const platform = process.platform

	if (platform === "win32") {
		spawn("cmd.exe", ["/c", "start", '""', url], { detached: true, stdio: "ignore" }).unref()
		return
	}

	if (platform === "darwin") {
		spawn("open", [url], { detached: true, stdio: "ignore" }).unref()
		return
	}

	if (process.env.TERMUX_VERSION || hasBin("termux-open")) {
		spawn("termux-open", [url], { detached: true, stdio: "ignore" }).unref()
		return
	}

	if (hasBin("xdg-open")) {
		spawn("xdg-open", [url], { detached: true, stdio: "ignore" }).unref()
	}
}

function showHelp() {
	process.stdout.write(
		`${styleText("bold", "Usage:")} vign-diff ${styleText("blue", "[command]")} ${styleText("blue", "[target]")} [flags]\n`,
	)
	process.stdout.write(`${styleText("bold", "Commands:")} diff (default), list, ls\n`)
	process.stdout.write(`${styleText("bold", "Flags:")} -V (verbose), -i (issue), -h (help)\n`)
	process.stdout.write(`${styleText("bold", "Targets:")}\n`)
	for (const [name, info] of Object.entries(TARGETS)) {
		process.stdout.write(`  ${styleText("blue", name.padEnd(14))} ${styleText("dim", info.cmd)}\n`)
	}
	if (UNSUPPORTED.length > 0) {
		process.stdout.write(`\x1b[1;38;5;208mUnsupported:\x1b[0m ${UNSUPPORTED.join(", ")}\n`)
	}
	process.stdout.write(`${styleText("bold", "Links:")}\n`)
	const repo = pkg.repository.url.replace(/^git\+/, "").replace(/\.git$/, "")
	const npmLink = `https://www.npmjs.org/package/${pkg.name}`
	const npmxLink = `https://www.npmx.dev/package/${pkg.name}`
	process.stdout.write(`${styleText("blue", repo)}\n`)
	process.stdout.write(`  ${styleText("blue", npmLink)}\n`)
	process.stdout.write(`  ${styleText("blue", npmxLink)}\n`)
	process.stdout.write(`v${styleText(["blue", "dim"], pkg.version)}\n`)
}

function hasBin(bin: string): boolean {
	if (existsSync(join(process.cwd(), "node_modules", ".bin", bin))) return true
	try {
		const cmd = process.platform === "win32" ? `where ${bin}` : `command -v ${bin}`
		execSync(cmd, { stdio: "ignore" })
		return true
	} catch {
		return false
	}
}

let cachedYarnVersion: string | null | undefined
function getYarnVersion(): string | null {
	if (cachedYarnVersion !== undefined) return cachedYarnVersion
	try {
		cachedYarnVersion = execSync("yarn --version", {
			stdio: ["ignore", "pipe", "ignore"],
		})
			.toString()
			.trim()
	} catch {
		cachedYarnVersion = null
	}
	return cachedYarnVersion
}

async function run(
	name: string,
	opt: { issue: boolean; list: boolean; verbose: boolean },
	isExplicit: boolean,
): Promise<boolean> {
	if (name === "yarn" || name === "yarn-classic") {
		const version = getYarnVersion()
		if (version) {
			const isV1 = version.startsWith("1.")
			if (name === "yarn" && isV1) {
				if (isExplicit) {
					process.stdout.write(
						`${styleText("yellow", "⚠")} ${styleText("bold", "Warning:")} Skipping ${styleText("blue", "yarn")} (detected Yarn Classic v${version}). Use ${styleText("blue", "yarn-classic")} instead.\n`,
					)
				}
				return false
			}
			if (name === "yarn-classic" && !isV1) {
				if (isExplicit) {
					process.stdout.write(
						`${styleText("yellow", "⚠")} ${styleText("bold", "Warning:")} Skipping ${styleText("blue", "yarn-classic")} (detected Yarn Berry v${version}). Use ${styleText("blue", "yarn")} instead.\n`,
					)
				}
				return false
			}
		}
	}

	const info = TARGETS[name]
	if (!info) {
		if (isExplicit) {
			process.stderr.write(
				`${styleText("red", "✖")} ${styleText("bold", "Error:")} Target "${name}" is not supported.\n`,
			)
			process.exit(1)
		}
		return false
	}

	if (!hasBin(info.bin)) {
		if (isExplicit) {
			process.stderr.write(
				`${styleText("red", "✖")} ${styleText("bold", "Error:")} Binary "${info.bin}" not found.\n`,
			)
			process.exit(1)
		}
		return false
	}

	let systemFiles: string[] = []
	try {
		const binPath = join(process.cwd(), "node_modules", ".bin")
		const env: Record<string, string | undefined> = { ...process.env, NO_COLOR: "1" }
		if (existsSync(binPath)) {
			const sep = process.platform === "win32" ? ";" : ":"
			env.PATH = `${binPath}${sep}${process.env.PATH || ""}`
		}

		const out = execSync(`${info.cmd} 2>&1`, {
			env,
			stdio: ["ignore", "pipe", "pipe"],
		}).toString()
		systemFiles = info.parse(out)
	} catch (err: unknown) {
		let msg = err instanceof Error ? err.message : String(err)
		if (err && typeof err === "object" && "stdout" in err && err.stdout) {
			msg =
				Buffer.isBuffer(err.stdout) || typeof err.stdout === "string"
					? err.stdout.toString()
					: String(err.stdout)
		}
		msg = stripVTControlCharacters(msg)

		const isMissingConfig =
			msg.includes("Couldn't find a deno.json") ||
			msg.includes("jsr.json configuration file") ||
			msg.includes("No valid manifest found")

		if (isMissingConfig) {
			if (isExplicit) {
				process.stderr.write(
					`${styleText("red", "✖")} ${styleText("bold", "Error:")} Target "${name}" is not applicable here.\n`,
				)
				process.stderr.write(`      ${styleText("dim", msg.split(/\r?\n/)[0] || msg)}\n`)
				process.exit(1)
			}
			return false
		}

		if (isExplicit) {
			process.stderr.write(
				`${styleText("red", "✖")} ${styleText("bold", "Error:")} System command failed for target "${name}":\n`,
			)
			process.stderr.write(`      ${styleText("dim", msg)}\n`)
			process.exit(1)
		}
		return false
	}

	const start = performance.now()
	let ctx: MatcherContext
	try {
		ctx = await scan({ skipInternal: true, target: info.make() })
	} catch (err: unknown) {
		const msg = err instanceof Error ? err.message : `unknown error ${JSON.stringify(err)}`
		process.stderr.write(
			`${styleText("red", "✖")} ${styleText("bold", "Error:")} Scan failed for "${name}": ${msg}\n`,
		)
		return false
	}
	const dur = performance.now() - start

	if (opt.list) {
		process.stdout.write(
			`${styleText(["blue", "bold"], "→")} ${styleText("bold", "Included files")} for ${styleText("blue", name)} (${fmtTime(dur)}):\n`,
		)
		Array.from(ctx!.paths.entries())
			.filter(([p, m]) => !p.endsWith("/") && !m.ignored)
			.map(([p]) => p)
			.sort()
			.forEach((f) => console.log(`  ${styleText("dim", "•")} ${f}`))
	}

	const vignFiles = Array.from(ctx!.paths.entries())
		.filter(([p, m]) => !p.endsWith("/") && !m.ignored)
		.map(([p]) => p)
		.sort()
	const vignSet = new Set(vignFiles)
	const sysSet = new Set(systemFiles)
	const diffs: Diff[] = []

	for (const f of systemFiles)
		if (!vignSet.has(f))
			diffs.push({
				file: f,
				issue: "Missing in view-ignored",
				match: ctx!.paths.get(f) || { ignored: true, kind: RuleMatchKind.none },
			})
	for (const f of vignFiles)
		if (!sysSet.has(f))
			diffs.push({
				file: f,
				issue: "Unexpectedly included by view-ignored",
				match: ctx!.paths.get(f)!,
			})

	if (diffs.length > 0) {
		process.stdout.write(
			`${styleText("red", "✖")} ${styleText("bold", "Discrepancies found")} for target ${styleText("blue", name)} (${fmtTime(dur)}):\n`,
		)

		const reports = diffs.map((d) => {
			const m = d.match as RuleMatch
			const origin =
				m.kind === RuleMatchKind.external
					? m.source.path
					: m.kind === RuleMatchKind.internal
						? "internal"
						: "none"
			const pattern =
				m.kind === RuleMatchKind.external || m.kind === RuleMatchKind.internal
					? m.pattern
					: undefined
			return { ...d, origin, pattern }
		})

		const groups: Record<string, typeof reports> = {}
		for (const r of reports) {
			const key = `${r.issue}|${r.pattern || ""}|${r.origin}`
			if (!groups[key]) groups[key] = []
			groups[key].push(r)
		}

		const sortedGroups = Object.values(groups).sort((a, b) => {
			const aIsUnexpected = a[0]?.issue.startsWith("Unexpectedly")
			const bIsUnexpected = b[0]?.issue.startsWith("Unexpectedly")
			if (aIsUnexpected && !bIsUnexpected) return -1
			if (!aIsUnexpected && bIsUnexpected) return 1
			return 0
		})

		for (const group of sortedGroups) {
			const first = group[0]
			if (!first) continue
			const icon = first.issue.startsWith("Missing")
				? styleText("yellow", "[-] ")
				: styleText("red", "[+] ")

			const limit = 5
			const shown = group.slice(0, limit)
			const hidden = group.length - limit

			for (const r of shown) {
				console.log(
					`  ${icon}${styleText("bold", r.file)}\n      ${styleText("dim", "Issue:")}  ${r.issue}${r.pattern ? `\n      ${styleText("dim", "Pattern:")} ${styleText("blue", r.pattern)} (${styleText("dim", r.origin)})` : ""}`,
				)
			}
			if (hidden > 0) {
				console.log(`      ${styleText("dim", `... and ${hidden} more items`)}`)
			}
		}

		process.stdout.write(
			`  ${styleText("red", "✖")} Total ${styleText("bold", diffs.length.toString())} discrepancies found.\n`,
		)

		if (opt.verbose) {
			process.stdout.write(styleText("dim", "--- RAW REPORT ---\n"))
			console.log(JSON.stringify(reports, null, 2))
		}
		if (opt.issue) {
			const repo = pkg.repository.url.replace(/^git\+/, "").replace(/\.git$/, "")
			const title = encodeURIComponent(`[vign-diff] Bug found in ${name}`)
			const body = encodeURIComponent(
				`Discrepancy report for **${name}**:\n\n\`\`\`json\n${JSON.stringify(reports, null, 2)}\n\`\`\``,
			)
			openUrl(`${repo}/issues/new?title=${title}&body=${body}`)
			process.stdout.write(styleText("dim", "→ GitHub issue page opened.\n"))
		}
		return true
	}

	if (!opt.list)
		process.stdout.write(
			`${styleText(["green", "bold"], "✔")} ${styleText("bold", "Matches system behavior")} for ${styleText("blue", name)} (${fmtTime(dur)})\n`,
		)
	return false
}

async function main() {
	let args
	try {
		args = parseArgs({
			allowPositionals: true,
			options: {
				help: { short: "h", type: "boolean" },
				issue: { short: "i", type: "boolean" },
				verbose: { short: "V", type: "boolean" },
			},
		})
	} catch (err: unknown) {
		const msg = err instanceof Error ? err.message : String(err)
		console.error(styleText("red", `✖ ${msg}`))
		showHelp()
		process.exit(1)
	}

	const { values, positionals } = args
	if (values.help) {
		showHelp()
		return
	}

	const isList = positionals[0] === "list" || positionals[0] === "ls"
	const targetArg = isList || positionals[0] === "diff" ? positionals[1] : positionals[0]
	if (!targetArg) {
		showHelp()
		process.exit(1)
	}

	const opt = { issue: !!values.issue, list: isList, verbose: !!values.verbose }

	let hasDiff = false
	if (targetArg === "all") {
		for (const name of Object.keys(TARGETS)) {
			// eslint-disable-next-line no-await-in-loop
			if (await run(name, opt, false)) hasDiff = true
		}
	} else {
		hasDiff = await run(targetArg, opt, true)
	}
	process.exit(hasDiff ? 1 : 0)
}

main().catch((err) => {
	console.error(err)
	process.exit(1)
})
