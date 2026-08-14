#!/usr/bin/env node
import type { MatcherContext } from "../patterns/matcherContext.js"
import type { Target } from "../targets/target.js"
import type { ScanOptions } from "../types.js"

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
import { unixify } from "../unixify.js"

interface CommandSet {
	cmd: string
	parse: (out: string) => string[]
}

interface TargetDef {
	bin: string
	defaultSet: string
	// oxlint-disable-next-line typescript/no-explicit-any
	make: (mode?: any) => Target
	sets: Record<string, CommandSet>
}

function parseDenoOrJSR(out: string): string[] {
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
}

const TARGETS: Record<string, TargetDef> = {
	bun: {
		bin: "bun",
		defaultSet: "default",
		make: makeBun,
		sets: {
			default: {
				cmd: "bun pm pack --dry-run --ignore-scripts",
				parse: (out) => {
					const files: string[] = []
					for (const line of out.split(/\r?\n/)) {
						const match = line.match(/^packed\s+\S+\s+(.+)$/)
						if (match?.[1]) files.push(match[1].trim())
					}
					return files
				},
			},
		},
	},
	deno: {
		bin: "deno",
		defaultSet: "default",
		make: makeDeno,
		sets: {
			default: {
				cmd: "deno publish --dry-run --allow-dirty --allow-slow-types",
				parse: parseDenoOrJSR,
			},
		},
	},
	git: {
		bin: "git",
		defaultSet: "all",
		make: makeGit,
		sets: {
			all: {
				cmd: "git ls-files --others --exclude-standard --cached",
				parse: (out) => out.trim().split(/\r?\n/).filter(Boolean),
			},
			ignored: {
				cmd: "git ls-files --ignored --others --exclude-standard",
				parse: (out) => out.trim().split(/\r?\n/).filter(Boolean),
			},
			tracked: {
				cmd: "git ls-files --cached",
				parse: (out) => out.trim().split(/\r?\n/).filter(Boolean),
			},
			untracked: {
				cmd: "git ls-files --others --exclude-standard",
				parse: (out) => out.trim().split(/\r?\n/).filter(Boolean),
			},
		},
	},
	jsr: {
		bin: "jsr",
		defaultSet: "default",
		make: makeJSR,
		sets: {
			default: {
				cmd: "jsr publish --dry-run --allow-dirty --allow-slow-types",
				parse: parseDenoOrJSR,
			},
		},
	},
	npm: {
		bin: "npm",
		defaultSet: "json",
		make: makeNPM,
		sets: {
			json: {
				cmd: "npm pack --dry-run --json --ignore-scripts",
				parse: (out) => {
					const startIdx = out.indexOf("[")
					const endIdx = out.lastIndexOf("]")
					if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
						const jsonStr = out.slice(startIdx, endIdx + 1)
						try {
							const parsed = JSON.parse(jsonStr)
							const info = Array.isArray(parsed) ? parsed[0] : parsed
							if (info && Array.isArray(info.files)) {
								return info.files.map((f: { path: string }) => f.path)
							}
						} catch {}
					}
					return []
				},
			},
			text: {
				cmd: "npm pack --dry-run --ignore-scripts",
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
		},
	},
	vsce: {
		bin: "vsce",
		defaultSet: "default",
		make: makeVSCE,
		sets: {
			default: {
				cmd: "vsce ls",
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
		},
	},
	yarn: {
		bin: "yarn",
		defaultSet: "default",
		make: makeYarn,
		sets: {
			default: {
				cmd: "yarn pack --dry-run",
				parse: (out) => {
					const files: string[] = []
					for (const line of out.split(/\r?\n/)) {
						const match = line.match(/^- (.*)$/)
						if (match?.[1]) files.push(match[1].trim())
					}
					return files
				},
			},
		},
	},
	"yarn-classic": {
		bin: "yarn",
		defaultSet: "default",
		make: makeYarnClassic,
		sets: {
			default: {
				cmd: "yarn pack --filename .vign-diff.tgz",
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
							const sizeStr = buffer
								.subarray(offset - 512 + 124, offset - 512 + 124 + 12)
								.toString()
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
		},
	},
}

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
	const { platform } = process

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
	const b = (s: string) => styleText("bold", s)
	const d = (s: string) => styleText("dim", s)
	const blue = (s: string) => styleText("blue", s)

	console.log(`${b("vign-diff")} ${d(`v${pkg.version}`)}`)
	console.log(`Hunt for bugs by comparing ${b("view-ignored")} against system CLIs.\n`)

	console.log(`${b("Usage:")}`)
	console.log(`  vign-diff ${blue("[command]")} ${blue("<target>")} [flags]\n`)

	console.log(`${b("Commands:")}`)
	console.log(`  ${blue("diff")}                Compare against system CLI (default)`)
	console.log(`  ${blue("list")}, ${blue("ls")}            List files included by view-ignored\n`)

	console.log(`${b("Targets:")}`)
	const targetNames = Object.keys(TARGETS).sort()
	console.log(`  ${targetNames.join(", ")} (or ${blue("all")})\n`)

	console.log(`${b("Flags:")}`)
	console.log(`  ${blue("-i")}, ${blue("--issue")}         Open GitHub issue on discrepancy`)
	console.log(`  ${blue("-V")}, ${blue("--verbose")}       Show raw report`)
	console.log(`  ${blue("-h")}, ${blue("--help")}          Show this help output`)
	console.log(`  ${blue("-v")}, ${blue("--version")}       Show version`)
	console.log(`  ${blue("-c")}, ${blue("--cmd")}           Override standard CLI command`)
	console.log(
		`  ${blue("-s")}, ${blue("--cmd-set")}       Choose alternative predefined command set`,
	)
	console.log(
		`  ${blue("-m")}, ${blue("--mode")}          Target mode for NPM-like packages (publish, list, bundle)`,
	)
	console.log(`  ${blue("--depth")}             Depth limit for scanning`)
	console.log(`  ${blue("--dirs")}              Include/exclude directories in scan (true/false)`)
	console.log(`  ${blue("--skip-internal")}     Toggle skipping internal matches (true/false)`)
	console.log(`  ${blue("--invert")}            Inverting matcher rules (true, false, or 2)\n`)

	console.log(`${b("Examples:")}`)
	console.log(`  vign-diff git       ${d("# Compare against git")}`)
	console.log(`  vign-diff list npm  ${d("# List files for npm package")}`)
	console.log(`  vign-diff git -s untracked ${d("# Compare untracked files only")}`)
	console.log(`  vign-diff npm -s text ${d("# Compare using npm pack text output format")}`)
	console.log(`  vign-diff all -i    ${d("# Scan all and open issues")}\n`)

	const repo = pkg.repository.url.replace(/^git\+/, "").replace(/\.git$/, "")
	const npmLink = `https://www.npmjs.org/package/${pkg.name}`
	const npmxLink = `https://www.npmx.dev/package/${pkg.name}`
	console.log(`${b("Links:")}`)
	console.log(`  ${blue(repo)}`)
	console.log(`  ${blue(npmLink)}`)
	console.log(`  ${blue(npmxLink)}`)
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
	opt: {
		cmd?: string
		cmdSet?: string
		depth?: string
		dirs?: boolean
		invert?: string
		issue: boolean
		list: boolean
		mode?: string
		skipInternal?: boolean
		verbose: boolean
	},
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

	if (opt.list) {
		const start = performance.now()
		let ctx: MatcherContext
		try {
			const modeArg = opt.mode as "publish" | "list" | "bundle" | undefined
			// oxlint-disable-next-line typescript/no-explicit-any
			const targetInstance = (info.make as any)(modeArg)

			const setName = opt.cmdSet || info.defaultSet
			const isInvert = opt.invert === "true" || setName === "ignored"

			let scanInvert: boolean | 2 = false
			if (opt.invert !== undefined) {
				if (opt.invert === "true") {
					scanInvert = true
				} else if (opt.invert === "false") {
					scanInvert = false
				} else if (opt.invert === "2") {
					scanInvert = 2
				} else {
					// oxlint-disable-next-line typescript/no-explicit-any
					scanInvert = opt.invert as any
				}
			} else if (setName === "ignored") {
				scanInvert = true
			}

			// Set scan options
			const scanOptions: ScanOptions = {
				dirs: opt.dirs !== undefined ? opt.dirs : false,
				invert: scanInvert,
				skipInternal: opt.skipInternal !== undefined ? opt.skipInternal : !isInvert,
				target: targetInstance,
			}

			if (opt.depth !== undefined) {
				scanOptions.depth = parseInt(opt.depth, 10)
			}

			ctx = await scan(scanOptions)
		} catch (err: unknown) {
			const msg = err instanceof Error ? err.message : `unknown error ${JSON.stringify(err)}`
			const isNotApplicable =
				msg.includes("No valid manifest found") || msg.includes("'package.json' not found")

			if (isNotApplicable) {
				if (isExplicit) {
					process.stderr.write(
						`${styleText("red", "✖")} ${styleText("bold", "Error:")} Target "${name}" is not applicable here.\n`,
					)
					process.stderr.write(`      ${styleText("dim", msg)}\n`)
					process.exit(1)
				}
				return false
			}

			process.stderr.write(
				`${styleText("red", "✖")} ${styleText("bold", "Error:")} Scan failed for "${name}": ${msg}\n`,
			)
			return false
		}
		const dur = performance.now() - start

		process.stdout.write(
			`${styleText(["blue", "bold"], "→")} ${styleText("bold", "Included files")} for ${styleText("blue", name)} (${fmtTime(dur)}):\n`,
		)
		Array.from(ctx!.paths.keys())
			.sort()
			.forEach((f) => console.log(`  ${styleText("dim", "•")} ${f}`))
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

	const setName = opt.cmdSet || info.defaultSet
	const setDef = info.sets[setName]
	if (!setDef && !opt.cmd) {
		if (isExplicit) {
			process.stderr.write(
				`${styleText("red", "✖")} ${styleText("bold", "Error:")} Predefined command set "${setName}" not found for target "${name}".\n`,
			)
			process.exit(1)
		}
		return false
	}

	const cmdToRun = opt.cmd || setDef!.cmd
	const parseFn = setDef ? setDef.parse : info.sets[info.defaultSet]!.parse

	let systemFiles: string[] = []
	try {
		const binPath = join(process.cwd(), "node_modules", ".bin")
		const env: Record<string, string | undefined> = { ...process.env, NO_COLOR: "1" }
		if (existsSync(binPath)) {
			const sep = process.platform === "win32" ? ";" : ":"
			env.PATH = `${binPath}${sep}${process.env.PATH || ""}`
		}

		const out = execSync(`${cmdToRun} 2>&1`, {
			env,
			stdio: ["ignore", "pipe", "pipe"],
		}).toString()
		systemFiles = parseFn(out).map((f) => unixify(f))
	} catch (err: unknown) {
		let msg = err instanceof Error ? err.message : String(err)
		if (err && typeof err === "object" && "stdout" in err && err.stdout) {
			const isBuf = Buffer.isBuffer(err.stdout) || typeof err.stdout === "string"
			msg = isBuf ? err.stdout.toString() : (JSON.stringify(err.stdout) ?? "")
		}
		msg = stripVTControlCharacters(msg)

		const isMissingConfig =
			msg.includes("Couldn't find a deno.json") ||
			msg.includes("jsr.json configuration file") ||
			msg.includes("No valid manifest found") ||
			msg.includes("Could not read package.json") ||
			msg.includes("No package.json was found") ||
			msg.includes("Couldn't find a package.json file") ||
			msg.includes("Extension manifest not found") ||
			msg.includes("not a git repository") ||
			msg.includes("Missing vscode engine compatibility version") ||
			msg.includes("Missing engines.vscode")

		if (isMissingConfig) {
			if (!isExplicit) return false
			process.stderr.write(
				`${styleText("red", "✖")} ${styleText("bold", "Error:")} Target "${name}" is not applicable here.\n`,
			)
			process.stderr.write(`      ${styleText("dim", msg.split(/\r?\n/)[0] || msg)}\n`)
			process.exit(1)
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
		const modeArg = opt.mode as "publish" | "list" | "bundle" | undefined
		// oxlint-disable-next-line typescript/no-explicit-any
		const targetInstance = (info.make as any)(modeArg)

		const isInvert = opt.invert === "true" || setName === "ignored"

		let scanInvert: boolean | 2 = false
		if (opt.invert !== undefined) {
			if (opt.invert === "true") {
				scanInvert = true
			} else if (opt.invert === "false") {
				scanInvert = false
			} else if (opt.invert === "2") {
				scanInvert = 2
			} else {
				// oxlint-disable-next-line typescript/no-explicit-any
				scanInvert = opt.invert as any
			}
		} else if (setName === "ignored") {
			scanInvert = true
		}

		// Set scan options
		const scanOptions: ScanOptions = {
			dirs: opt.dirs !== undefined ? opt.dirs : false,
			invert: scanInvert,
			skipInternal: opt.skipInternal !== undefined ? opt.skipInternal : !isInvert,
			target: targetInstance,
		}

		if (opt.depth !== undefined) {
			scanOptions.depth = parseInt(opt.depth, 10)
		}

		ctx = await scan(scanOptions)
	} catch (err: unknown) {
		const msg = err instanceof Error ? err.message : `unknown error ${JSON.stringify(err)}`
		const isNotApplicable =
			msg.includes("No valid manifest found") || msg.includes("'package.json' not found")

		if (isNotApplicable) {
			if (isExplicit) {
				process.stderr.write(
					`${styleText("red", "✖")} ${styleText("bold", "Error:")} Target "${name}" is not applicable here.\n`,
				)
				process.stderr.write(`      ${styleText("dim", msg)}\n`)
				process.exit(1)
			}
			return false
		}

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
		Array.from(ctx!.paths.keys())
			.sort()
			.forEach((f) => console.log(`  ${styleText("dim", "•")} ${f}`))
	}

	let vignFiles = Array.from(ctx!.paths.keys()).sort()

	// If we are looking specifically at untracked / tracked git files, we filter vignFiles using git CLI output
	if (name === "git") {
		if (setName === "untracked") {
			// Filter out files that are tracked.
			// Let's get tracked files using git ls-files --cached
			try {
				const trackedOut = execSync("git ls-files --cached", {
					stdio: ["ignore", "pipe", "pipe"],
				}).toString()
				const trackedSet = new Set(
					trackedOut
						.trim()
						.split(/\r?\n/)
						.filter(Boolean)
						.map((f) => unixify(f)),
				)
				vignFiles = vignFiles.filter((f) => !trackedSet.has(f))
			} catch {}
		} else if (setName === "tracked") {
			// Filter only tracked files.
			try {
				const trackedOut = execSync("git ls-files --cached", {
					stdio: ["ignore", "pipe", "pipe"],
				}).toString()
				const trackedSet = new Set(
					trackedOut
						.trim()
						.split(/\r?\n/)
						.filter(Boolean)
						.map((f) => unixify(f)),
				)
				vignFiles = vignFiles.filter((f) => trackedSet.has(f))
			} catch {}
		}
	}

	const vignSet = new Set(vignFiles)
	const sysSet = new Set(systemFiles)
	const diffs: Diff[] = []

	for (const f of systemFiles) {
		if (!vignSet.has(f)) {
			diffs.push({
				file: f,
				issue: "Missing in view-ignored",
				match: ctx!.paths.get(f) || { ignored: true, kind: RuleMatchKind.none },
			})
		}
	}
	for (const f of vignFiles) {
		if (sysSet.has(f)) continue
		diffs.push({
			file: f,
			issue: "Unexpectedly included by view-ignored",
			match: ctx!.paths.get(f) || { ignored: false, kind: RuleMatchKind.none },
		})
	}

	if (diffs.length > 0) {
		process.stdout.write(
			`${styleText("red", "✖")} ${styleText("bold", "Discrepancies found")} for target ${styleText("blue", name)} (set: ${styleText("yellow", setName)}) (${fmtTime(dur)}):\n`,
		)
		const reports = diffs.map((d) => {
			const m = d.match as RuleMatch
			const origin =
				m.kind === RuleMatchKind.external
					? (m.source?.path ?? "<null source>")
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
			const key = `${r.issue}|${JSON.stringify(r.pattern) || ""}|${r.origin}`
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
			const [first] = group
			if (!first) continue
			const icon = first.issue.startsWith("Missing")
				? styleText("yellow", "[-] ")
				: styleText("red", "[+] ")

			const limit = 5
			const shown = group.slice(0, limit)
			const hidden = group.length - limit

			for (const r of shown) {
				console.log(
					`  ${icon}${styleText("bold", r.file)}\n      ${styleText("dim", "Issue:")}  ${r.issue}${r.pattern ? `\n      ${styleText("dim", "Pattern:")} ${styleText("blue", JSON.stringify(r.pattern))} (${styleText("dim", r.origin)})` : ""}`,
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

	if (!opt.list) {
		process.stdout.write(
			`${styleText(["green", "bold"], "✔")} ${styleText("bold", "Matches system behavior")} for ${styleText("blue", name)} (set: ${styleText("yellow", setName)}) (${fmtTime(dur)})\n`,
		)
	}
	return false
}

async function main() {
	let args
	try {
		const processedArgv = [...process.argv]
		// If "--invert" is after "--", we move it before "--"
		const dDashIdx = processedArgv.indexOf("--")
		if (dDashIdx !== -1) {
			const invertIdx = processedArgv.indexOf("--invert", dDashIdx)
			if (invertIdx !== -1) {
				processedArgv.splice(invertIdx, 1)
				let value: string | undefined
				const nextArg = invertIdx < processedArgv.length ? processedArgv[invertIdx] : undefined
				if (nextArg && !nextArg.startsWith("-")) {
					value = nextArg
					processedArgv.splice(invertIdx, 1)
				}
				processedArgv.splice(dDashIdx, 0, "--invert")
				if (value !== undefined) {
					processedArgv.splice(dDashIdx + 1, 0, value)
				}
			}
		}

		// Detect "--invert" as a boolean flag and map it to "--invert true"
		for (let i = 2; i < processedArgv.length; i++) {
			const arg = processedArgv[i]
			if (arg !== "--invert") continue
			const next = processedArgv[i + 1]
			if (next === undefined || next.startsWith("-")) {
				processedArgv.splice(i + 1, 0, "true")
			}
		}

		args = parseArgs({
			allowPositionals: true,
			args: processedArgv.slice(2),
			options: {
				cmd: { short: "c", type: "string" },
				"cmd-set": { short: "s", type: "string" },
				depth: { type: "string" },
				dirs: { type: "boolean" },
				help: { short: "h", type: "boolean" },
				invert: { type: "string" },
				issue: { short: "i", type: "boolean" },
				mode: { short: "m", type: "string" },
				"skip-internal": { type: "boolean" },
				verbose: { short: "V", type: "boolean" },
				version: { short: "v", type: "boolean" },
			},
		})
	} catch (err: unknown) {
		const msg = err instanceof Error ? err.message : String(err)
		console.error(styleText("red", `✖ ${msg}`))
		showHelp()
		process.exit(1)
	}

	const { values, positionals } = args
	if (values.help || positionals[0] === "help") {
		showHelp()
		return
	}

	if (values.version) {
		console.log(`v${pkg.version}`)
		return
	}

	const isList = positionals[0] === "list" || positionals[0] === "ls"
	const targetArg = isList || positionals[0] === "diff" ? positionals[1] : positionals[0]
	if (!targetArg) {
		showHelp()
		process.exit(1)
	}

	const opt = {
		cmd: values.cmd,
		cmdSet: values["cmd-set"],
		depth: values.depth,
		dirs: values.dirs,
		invert: values.invert,
		issue: !!values.issue,
		list: isList,
		mode: values.mode,
		skipInternal: values["skip-internal"],
		verbose: !!values.verbose,
	}

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
