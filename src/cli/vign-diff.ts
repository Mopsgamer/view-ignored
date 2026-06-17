#!/usr/bin/env node
import type { MatcherContext } from "../patterns/matcherContext.js"
import type { Target } from "../targets/target.js"

import { execSync } from "node:child_process"
import { performance } from "node:perf_hooks"
import { parseArgs, styleText } from "node:util"

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
		cmd: "deno publish --dry-run",
		make: makeDeno,
		parse: (out) =>
			out
				.trim()
				.split(/\r?\n/)
				.filter((line) => !line.startsWith("DRY RUN") && !line.startsWith("Publishing"))
				.map((line) => line.trim())
				.filter(Boolean),
	},
	git: {
		bin: "git",
		cmd: "git ls-files --others --exclude-standard --cached",
		make: makeGit,
		parse: (out) => out.trim().split(/\r?\n/).filter(Boolean),
	},
	jsr: {
		bin: "jsr",
		cmd: "jsr publish --dry-run",
		make: makeJSR,
		parse: (out) => out.trim().split(/\r?\n/).filter(Boolean),
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
		cmd: "yarn pack --dry-run",
		make: makeYarnClassic,
		parse: (out) => out.trim().split(/\r?\n/).filter(Boolean),
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
	const cmd =
		process.platform === "win32" ? "start" : process.platform === "darwin" ? "open" : "xdg-open"
	const args = process.platform === "win32" ? `"" "${url}"` : `"${url}"`
	try {
		execSync(`${cmd} ${args}`, { stdio: "ignore" })
	} catch {}
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
	try {
		const cmd = process.platform === "win32" ? `where ${bin}` : `command -v ${bin}`
		execSync(cmd, { stdio: "ignore" })
		return true
	} catch {
		return false
	}
}

async function run(
	name: string,
	opt: { issue: boolean; list: boolean; verbose: boolean },
	isExplicit: boolean,
): Promise<boolean> {
	const info = TARGETS[name]
	if (!info) {
		if (isExplicit) {
			process.stdout.write(styleText("red", `✖ Error: Target "${name}" is not supported.\n`))
			process.exit(1)
		}
		return false
	}

	if (!hasBin(info.bin)) {
		if (isExplicit) {
			process.stderr.write(styleText("red", `✖ Error: Binary "${info.bin}" not found.\n`))
			process.exit(1)
		}
		return false
	}

	let systemFiles: string[] = []
	let systemError: unknown = null
	try {
		const out = execSync(`${info.cmd} 2>&1`, {
			env: { ...process.env, NO_COLOR: "1" },
			stdio: ["ignore", "pipe", "pipe"],
		}).toString()
		systemFiles = info.parse(out)
	} catch (err: unknown) {
		systemError = err
	}

	const start = performance.now()
	let ctx: MatcherContext
	let vignError: unknown = null
	try {
		ctx = await scan({ skipInternal: true, target: info.make() })
	} catch (err: unknown) {
		vignError = err
	}
	const dur = performance.now() - start

	if (systemError && vignError) {
		process.stdout.write(
			`${styleText(["green", "bold"], "✔")} Matches system behavior for ${styleText("blue", name)} (both failed, ${fmtTime(dur)})\n`,
		)
		return false
	}

	if (vignError) {
		const msg =
			vignError instanceof Error ? vignError.message : `unknown error ${JSON.stringify(vignError)}`
		process.stderr.write(styleText("red", `✖ Error: Scan failed for "${name}": ${msg}\n`))
		return false
	}

	if (systemError) {
		process.stdout.write(
			`${styleText(["yellow", "bold"], "⚠ Warning:")} Command "${info.cmd}" failed for ${styleText("blue", name)}, but scanned anyway.\n`,
		)
		if (opt.verbose) {
			const msg =
				systemError instanceof Error
					? systemError.message
					: `unknown error ${JSON.stringify(systemError)}`
			console.error(styleText("dim", msg))
		}
	}

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

	if (!systemError) {
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
	} else if (vignFiles.length > 0) {
		for (const f of vignFiles)
			diffs.push({
				file: f,
				issue: "Unexpectedly included by view-ignored (system tool failed to list any)",
				match: ctx!.paths.get(f)!,
			})
	}

	if (diffs.length > 0) {
		process.stdout.write(
			`${styleText(["red", "bold"], "✖ Discrepancies found")} for target ${styleText("blue", name)} (${fmtTime(dur)}):\n`,
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
			const icon = d.issue.startsWith("Missing")
				? styleText("yellow", "[-] ")
				: styleText("red", "[+] ")
			console.log(
				`  ${icon}${styleText("bold", d.file)}\n      ${styleText("dim", "Issue:")}  ${d.issue}${pattern ? `\n      ${styleText("dim", "Pattern:")} ${styleText("blue", pattern)} (${styleText("dim", origin)})` : ""}`,
			)
			return { issue: d.issue, origin, path: d.file, pattern, ruleMatch: d.match }
		})
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

	if (!opt.list && !systemError)
		process.stdout.write(
			`${styleText(["green", "bold"], "✔")} Matches system behavior for ${styleText("blue", name)} (${fmtTime(dur)})\n`,
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
