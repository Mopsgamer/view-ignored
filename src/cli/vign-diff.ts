#!/usr/bin/env node
import { parseArgs, styleText } from "node:util";
import { execSync } from "node:child_process";
import { performance } from "node:perf_hooks";
import { scan } from "../scan.js";
import {
	makeGit,
	makeNPM,
	makeBun,
	makeVSCE,
	makeDeno,
	makeJSR,
	makeYarn,
	makeYarnClassic,
} from "../targets/index.js";
import type { Target } from "../targets/target.js";
import pkg from "../../package.json" with { type: "json" };
import { RuleMatchKind, type RuleMatch } from "../patterns/rule.js";
import type { MatcherContext } from "../patterns/matcherContext.js";

/**
 * Design Philosophy:
 * This is a senior-grade diagnostic utility. It favors readability,
 * robust error handling, and precise reporting over brevity.
 */

interface TargetDefinition {
    make: () => Target;
    cmd: string;
    parse: (out: string) => string[];
}

const SUPPORTED_TARGETS: Record<string, TargetDefinition> = {
	git: {
		make: makeGit,
		cmd: "git ls-files --others --exclude-standard --cached",
		parse: (out) => out.trim().split(/\r?\n/).filter(Boolean),
	},
	npm: {
		make: makeNPM,
		cmd: "npm pack --dry-run",
		parse: (out) => {
			const files: string[] = [];
			let inContents = false;
			for (const line of out.split(/\r?\n/)) {
				if (line.includes("Tarball Contents")) { inContents = true; continue; }
				if (inContents && line.includes("Tarball Details")) break;
				if (inContents) {
					const match = line.match(/npm notice\s+\S+\s+(.+)/);
					if (match?.[1]) files.push(match[1].trim());
				}
			}
			return files;
		},
	},
	bun: {
		make: makeBun,
		cmd: "bun pm pack --dry-run",
		parse: (out) => {
			const files: string[] = [];
			for (const line of out.split(/\r?\n/)) {
				const match = line.match(/^packed\s+\S+\s+(.+)$/);
				if (match?.[1]) files.push(match[1].trim());
			}
			return files;
		},
	},
	vsce: {
		make: makeVSCE,
		cmd: "vsce ls",
		parse: (out) => out.trim().split(/\r?\n/).filter(line =>
            line && !line.startsWith("npm notice") && !line.includes("DeprecationWarning") && !line.startsWith("ERROR")
        ).filter(Boolean),
	},
	deno: {
		make: makeDeno,
		cmd: "deno publish --dry-run",
		parse: (out) => out.trim().split(/\r?\n/).filter(line =>
            !line.startsWith("DRY RUN") && !line.startsWith("Publishing")
        ).map(line => line.trim()).filter(Boolean),
	},
	jsr: {
		make: makeJSR,
		cmd: "jsr publish --dry-run",
		parse: (out) => out.trim().split(/\r?\n/).filter(Boolean),
	},
	yarn: {
		make: makeYarn,
		cmd: "yarn pack --dry-run",
		parse: (out) => {
			const files: string[] = [];
			for (const line of out.split(/\r?\n/)) {
				const match = line.match(/^- (.*)$/);
				if (match?.[1]) files.push(match[1].trim());
			}
			return files;
		},
	},
	"yarn-classic": {
		make: makeYarnClassic,
		cmd: "yarn pack --dry-run",
		parse: (out) => out.trim().split(/\r?\n/).filter(Boolean),
	},
};

const UNSUPPORTED_TARGETS = ["docker", "pnpm"];

interface Discrepancy {
    file: string;
    issue: string;
    match: RuleMatch;
}

/**
 * Formats duration with appropriate units and coloring.
 */
function formatDuration(ms: number): string {
    if (ms < 1) return styleText("cyan", `${(ms * 1000).toFixed(2)}µs`);
    if (ms < 1000) return styleText("cyan", `${ms.toFixed(2)}ms`);
    return styleText("cyan", `${(ms / 1000).toFixed(2)}s`);
}

/**
 * Safely opens a URL in the default browser using platform-specific commands.
 */
function openInBrowser(url: string) {
    const cmd = process.platform === "win32" ? "start" : process.platform === "darwin" ? "open" : "xdg-open";
    const args = process.platform === "win32" ? `"" "${url}"` : `"${url}"`;
    try {
        execSync(`${cmd} ${args}`, { stdio: "ignore" });
    } catch {
        process.stderr.write(styleText("dim", `\n! Failed to automatically open browser. Manually report at: ${url}\n`));
    }
}

/**
 * Displays the beautifully aligned help screen.
 */
function showHelp() {
    const header = `${styleText(["gray", "bold"], "vign-diff helps ")}${styleText(["blue", "bold"], "view-ignored")}${styleText(["gray", "bold"], " to find own bugs against real clis")}`;
    console.log(`\n${header}`);
    console.log(styleText("dim", "  Pre-v1 internal utility for bug hunting and discrepancy identification.\n"));

    console.log(styleText("bold", "Usage:"));
    console.log(`  vign-diff ${styleText("blue", "[command]")} ${styleText("blue", "[target]")} [flags]\n`);

    console.log(styleText("bold", "Commands:"));
    console.log(`  diff            ${styleText("dim", "Scan and identify discrepancies (default).")}`);
    console.log(`  list, ls        ${styleText("dim", "List all files included by view-ignored.")}`);

    console.log(`\n${styleText("bold", "Flags:")}`);
    console.log(`  -V, --verbose   ${styleText("dim", "Enable verbose error logging.")}`);
    console.log(`  -i, --issue     ${styleText("dim", "Open prefilled GitHub issue on discrepancy.")}`);
    console.log(`  -h, --help      ${styleText("dim", "Display this help screen.")}\n`);

    console.log(styleText("bold", "Targets:"));
    for (const [name, info] of Object.entries(SUPPORTED_TARGETS)) {
        console.log(`  ${styleText("blue", name.padEnd(14))} ${styleText("dim", info.cmd)}`);
    }

    console.log(`\n\x1b[1;38;5;208mUnsupported Targets:\x1b[0m`);
    console.log(`  \x1b[1;38;5;208m${UNSUPPORTED_TARGETS.join(", ")}\x1b[0m\n`);

    const repo = pkg.repository.url.replace(/^git\+/, "").replace(/\.git$/, "");
    console.log(styleText("bold", "Links:"));
    console.log(`  GitHub:  ${styleText("blue", repo)}`);
    console.log(`  Version: ${styleText("blue", pkg.version)}\n`);
}

/**
 * Executes the system command and returns parsed file list.
 */
function getSystemFiles(name: string, info: TargetDefinition, verbose: boolean): string[] {
    try {
        // Many tools like npm and deno output to stderr for dry-runs/metadata
        const output = execSync(`${info.cmd} 2>&1`, {
            stdio: ["ignore", "pipe", "pipe"],
            env: { ...process.env, NO_COLOR: "1" }
        }).toString();
        return info.parse(output);
    } catch (err: any) {
        process.stdout.write(`\n${styleText(["yellow", "bold"], "⚠ Warning:")} Command "${info.cmd}" failed for target ${styleText("blue", name)}.\n`);
        if (verbose) {
            console.error(styleText("dim", err.stderr?.toString() || err.message));
        }
        return [];
    }
}

/**
 * Compares system files vs view-ignored files to find discrepancies.
 */
function findDiscrepancies(systemFiles: string[], vignCtx: MatcherContext): Discrepancy[] {
    const vignFiles = Array.from(vignCtx.paths.entries())
        .filter(([p, match]) => !p.endsWith("/") && !match.ignored)
        .map(([p]) => p)
        .sort();

    const vignSet = new Set(vignFiles);
    const systemSet = new Set(systemFiles);
    const result: Discrepancy[] = [];

    for (const file of systemFiles) {
        if (!vignSet.has(file)) {
            result.push({
                file,
                issue: "Missing in view-ignored",
                match: vignCtx.paths.get(file) || { kind: RuleMatchKind.none, ignored: true },
            });
        }
    }

    for (const file of vignFiles) {
        if (!systemSet.has(file)) {
            result.push({
                file,
                issue: "Unexpectedly included by view-ignored",
                match: vignCtx.paths.get(file)!,
            });
        }
    }

    return result;
}

/**
 * Main execution logic for a single target.
 */
async function runTarget(name: string, options: { verbose: boolean; list: boolean; issue: boolean }): Promise<boolean> {
    const info = SUPPORTED_TARGETS[name];
    if (!info) {
        if (name !== "all" && name) process.stdout.write(styleText("yellow", `! Warning: Target "${name}" is not supported.\n`));
        return false;
    }

    const systemFiles = getSystemFiles(name, info, options.verbose);
    const start = performance.now();
    let vignCtx: MatcherContext;
    try {
        vignCtx = await scan({ target: info.make(), fastInternal: true });
    } catch (err: any) {
        console.error(styleText("red", `✖ Error: Scan failed for "${name}": ${err.message}`));
        return false;
    }
    const duration = performance.now() - start;

    if (options.list) {
        console.log(`\n${styleText(["blue", "bold"], "→")} ${styleText("bold", "Included files")} for ${styleText("blue", name)} (${formatDuration(duration)}):`);
        Array.from(vignCtx.paths.entries())
            .filter(([p, m]) => !p.endsWith("/") && !m.ignored)
            .map(([p]) => p)
            .sort()
            .forEach(f => console.log(`  ${styleText("dim", "•")} ${f}`));
    }

    const discrepancies = findDiscrepancies(systemFiles, vignCtx);

    if (discrepancies.length > 0) {
        console.log(`\n${styleText(["red", "bold"], "✖ Discrepancies found")} for target ${styleText("blue", name)} (${formatDuration(duration)}):`);
        const reports = discrepancies.map(d => ({
            path: d.file,
            issue: d.issue,
            pattern: (d.match.kind === RuleMatchKind.external || d.match.kind === RuleMatchKind.internal) ? d.match.pattern : undefined,
            origin: d.match.kind === RuleMatchKind.external ? d.match.source.path : (d.match.kind === RuleMatchKind.internal ? "internal" : "none"),
            ruleMatch: d.match,
        }));
        console.log(JSON.stringify(reports, null, 2));

        if (options.issue) {
            const repo = pkg.repository.url.replace(/^git\+/, "").replace(/\.git$/, "");
            const title = encodeURIComponent(`[vign-diff] Bug found in ${name}`);
            const body = encodeURIComponent(`Discrepancy report for target **${name}**:\n\n\`\`\`json\n${JSON.stringify(reports, null, 2)}\n\`\`\``);
            openInBrowser(`${repo}/issues/new?title=${title}&body=${body}`);
            console.log(styleText("dim", `\n→ GitHub issue page opened.`));
        }
        return true;
    }

    if (!options.list) {
        process.stdout.write(`${styleText(["green", "bold"], "✔")} Matches system behavior for ${styleText("blue", name)} (${formatDuration(duration)})\n`);
    }
    return false;
}

/**
 * Entry point.
 */
async function main() {
    let args;
    try {
        args = parseArgs({
            options: {
                verbose: { type: "boolean", short: "V" },
                help: { type: "boolean", short: "h" },
                issue: { type: "boolean", short: "i" },
            },
            allowPositionals: true,
        });
    } catch (err: any) {
        console.error(styleText("red", `✖ ${err.message}`));
        showHelp();
        process.exit(1);
    }

    const { values, positionals } = args;
    if (values.help) { showHelp(); return; }

    const isList = positionals[0] === "list" || positionals[0] === "ls";
    const targetArg = isList || positionals[0] === "diff" ? positionals[1] : positionals[0];

    if (!targetArg) { showHelp(); process.exit(1); }

    const options = {
        verbose: !!values.verbose,
        list: isList,
        issue: !!values.issue,
    };

    let hasDiff = false;
    if (targetArg === "all") {
        for (const target of Object.keys(SUPPORTED_TARGETS)) {
            if (await runTarget(target, options)) hasDiff = true;
        }
    } else {
        hasDiff = await runTarget(targetArg, options);
    }

    process.exit(hasDiff ? 1 : 0);
}

main().catch(err => {
    console.error(err);
    process.exit(1);
});
