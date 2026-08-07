<div align="center">
<h1>view-ignored</h1>

[![npm-version](https://img.shields.io/npm/v/view-ignored.svg)](https://www.npmjs.com/package/view-ignored)
[![npm-downloads](https://img.shields.io/npm/dm/view-ignored.svg?color=orange)](https://www.npmjs.com/package/view-ignored)
[![coverage](https://codecov.io/gh/Mopsgamer/view-ignored/graph/badge.svg?token=O5I06Y2A86)](https://codecov.io/gh/Mopsgamer/view-ignored)
![node-v22-or-later](https://img.shields.io/badge/node->=22-salad?repo=Mopsgamer/view-ignored.svg)
![ts-v5-or-later](https://img.shields.io/badge/ts->=5.7-salad?repo=Mopsgamer/view-ignored)
[![speed-fast](https://img.shields.io/badge/speed-fast-salad?repo=Mopsgamer/view-ignored.svg)](https://github.com/Mopsgamer/view-ignored/tree/main/benchmarks)
[![npm-packlist-tests](https://img.shields.io/badge/npm--packlist-56%2F68-blue)](https://github.com/Mopsgamer/view-ignored/tree/main/src/test-npm-packlist/)
[![wildmatch-tests](https://img.shields.io/badge/wildmatch-280%2F346-blue)](https://github.com/Mopsgamer/view-ignored/tree/main/src/test-wildmatch/)
[![ignore-tests](https://img.shields.io/badge/ignore-55%2F84-blue)](https://github.com/Mopsgamer/view-ignored/tree/main/src/test-wildmatch/)

Retrieve a list of files ignored or included by Git, NPM, Yarn, JSR, Deno, Bun, VS Code extension CLI, and other tools.

<img src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/git/git-original.svg" width="32" height="32" alt="git" />
<img src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/npm/npm-original-wordmark.svg" width="32" height="32" alt="npm" />
<img src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/yarn/yarn-original.svg" width="32" height="32" alt="yarn" />
<img src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/bun/bun-original.svg" width="32" height="32" alt="bun" />
<img src="https://docs.deno.com/img/logo.svg" width="32" height="32" alt="deno" />
<img src="https://jsr.io/logo.svg" width="32" height="32" alt="jsr" />
<img src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/vscode/vscode-original.svg" width="32" height="32" alt="vsce" />

[![issues-for-targets](https://img.shields.io/badge/issues-targets-blue)](https://github.com/Mopsgamer/view-ignored/issues?q=is%3Aissue%20state%3Aopen%20label%3Atargets)
[![suggest](https://img.shields.io/badge/suggest-salad?repo=Mopsgamer/view-ignored)](https://github.com/Mopsgamer/view-ignored/issues/new)
[![details](https://img.shields.io/badge/details-gray)](#targets)

</div>

## Highlights

- **Reader.** Get a list of included files by parsing configuration files directly, without wrapping command-line tools.
- **Reasoning.** Retrieve detailed information explaining why specific files are included or excluded, matching original rule paths and pattern details.
- **Fast.** Highly optimized for performance with minimal memory overhead.
- **Plugins.** Built-in [targets](#targets) for popular tools. Create custom targets by implementing the `Target` interface.
- **Streaming.** Native `scanStream` support for processing massive file trees with minimal memory overhead.
- **Execution Control.** Fine-tune traversal depth and skip unnecessary directory checks using the `fastDepth` and `fastInternal` options. Supports standard `AbortSignal` to cancel long-running scans instantly.
- **Lightweight.** Minimal dependencies for fast performance and a small bundle size.
- **Browser.** Fully compatible with browser environments when bundled.
- **Windows.** Converts Windows-style paths to Unix format to guarantee compatibility across test frameworks (like `memfs`) and browser bundles.

> [!NOTE]
> Despite its name, the library's default behavior is to retrieve **included** files (i.e., files that are **not ignored**). If you want ignored files, or both, set the `invert` option: `true` returns only ignored files, while `2` returns all files annotated with their exact ignore status.

## v1 Roadmap

- [x] **Perfect API.** Designed and finalized a clean, type-safe API for scanning and stream consumption.
- [x] **Works for common use cases.** Production-ready for general project directory walking and status reports.
- [ ] **Follow `.gitignore` spec.** Ensure strict alignment with Git's wildmatch algorithm (character classes, brackets, and negative matches), as `ignore` does.
- [ ] **Handle Git config.** Parse and support Git system/global settings (such as local `.git/config` reference rules and `core.excludesfile` parsing).
- [ ] **Include node_modules bundled dependencies correctly.** Walk subdependency folders under `bundledDependencies` for accurate package manager packing emulation.
- [ ] **Ensure compatibility and references.** Perfect self-tests and comparisons against real CLI packaging output.
- [ ] **\*Move targets into separate packages.** Decouple individual target modules into scoped sub-packages to reduce core bundle size (optional).

<sub>\* - Optional.</sub>

## Why this library exists

This library was created to solve several long-standing issues in the JavaScript ecosystem:

- **Inconsistent Ignore Behavior:** Tools like VS Code, CLI bundlers, and custom scripts often differ in how they evaluate `.gitignore` and `.npmignore` patterns.
- **Heavy Dependencies:** Alternative analysis libraries (such as `npm-packlist` or `ignore-walk`) carry deep, complex, and heavy dependency trees.
- **Lack of Wildmatch Support:** Standard JS glob engines do not strictly adhere to Git's native wildmatch algorithm.
- **No Explanability:** There was no lightweight, high-performance way to query _why_ a particular file was included or excluded with a traceable rule-origin path.

## Usage

### Basic example

```ts
import * as vign from "view-ignored"
// also available:
// "/scan", "/stream"
// "/browser", "/browser/scan", "/browser/stream"
import { makeGit } from "view-ignored/targets"
import { RuleMatchKind } from "view-ignored/patterns"

const ctx = await vign.scan({ target: makeGit() })
ctx.paths.has(".git/HEAD") // false
ctx.paths.has("src") // true

const match = ctx.paths.get("src")!
if (match.kind === RuleMatchKind.external) {
	console.log(match.source.path) // ".gitignore"
	console.log(match.pattern) // "src/**"
}
```

### Using a custom target

You can create custom targets by implementing the `Target` interface.
This example demonstrates a Docker-like target that caches its compiled glob rules to avoid redundant parsing across runs:

```ts
import type { Target } from "view-ignored/targets"

import {
	type Extractor,
	extractGitignore,
	ruleTest,
	ruleCompile,
	type InternalRules,
	type GlobRule,
} from "view-ignored/patterns"

let cachedDockerRule: GlobRule | null = null

export function makeDocker(): Target {
	const extractors: Extractor[] = [
		{
			extract: extractGitignore,
			path: ".dockerignore",
		},
	]

	cachedDockerRule ||= ruleCompile({
		compiled: null,
		excludes: true,
		list: [".git/", "node_modules/", ".DS_Store"],
	})

	const internal: InternalRules = {
		before: [cachedDockerRule],
		after: [],
	}

	return {
		extractors,
		ignores: ruleTest,
		internalRules: internal,
		root: ".",
	}
}
```

### Streaming Results

```ts
import * as vign from "view-ignored"
// or import * as vign from "view-ignored/stream"
import { makeNPM } from "view-ignored/targets"

const stream = vign.scanStream({ target: makeNPM() })

stream.addEventListener("dirent", console.log)
stream.addEventListener(
	"end",
	({ detail: ctx }) => {
		console.log(ctx.paths.has(".git/HEAD")) // false
		console.log(ctx.paths.has("node_modules/")) // false
		console.log(ctx.paths.has("package.json")) // true
	},
	{ once: true },
)
stream.start() // important
```

### Browser and Custom Filesystem Compatibility

To eliminate dependency on Node.js built-in modules (`node:fs` and `node:process`), import from the browser-specific subpaths and provide a custom filesystem adapter:

```ts
import * as vign from "view-ignored/browser"
// or "/browser/scan"
import { makeGit } from "view-ignored/targets"
import { readFile, readdir } from "original-fs"

export const cwd = process.cwd()
const customFs = { readFile, readdir }
await vign.scan({ cwd, fs: customFs, target: makeGit() })
```

### Watching for Changes

You can use the built-in context patchers to incrementally update the scan results without rescanning the entire directory tree. This is highly efficient for file watching services.

> [!IMPORTANT]
> Directory paths must have a trailing slash.

```ts
import { matcherContextAddPath, matcherContextRemovePath } from "view-ignored/patterns"

// Handle "created"
await matcherContextAddPath(ctx, options, "src/new-file.ts")

// Handle "removed"
await matcherContextRemovePath(ctx, options, "src/old-file.ts")

// Handle "changed"
// Best approach: remove and re-add
await matcherContextRemovePath(ctx, options, "src/file.ts")
await matcherContextAddPath(ctx, options, "src/file.ts")
```

#### Edge Cases and Limitations

- **Idempotency**: Patcher functions for files are **not idempotent**. Calling `matcherContextAddPath` multiple times for the same path without removing it first will corrupt the `totalFiles` and `totalMatchedFiles` counts in `ctx.total`. Always call `matcherContextRemovePath` before `matcherContextAddPath` if the path might already exist in the context.
- **Directories**: Directory paths **must end with a slash** (e.g., `src/`). If you omit the slash, it will be treated as a file, and its contents will not be tracked or updated correctly.
- **Renames**: To handle a file or directory rename, first call `matcherContextRemovePath` on the old path, then `matcherContextAddPath` on the new path.
- **Source Files**: If a file that acts as an ignore source (like `.gitignore` or `package.json`) is added or changed, the patcher will automatically rescan the directory containing that source file to update the matching rules and state for all affected files.
- **Depth**: Patchers respect the `depth` option provided in the `ScanOptions`. If you add a path deeper than the specified depth, it might not be fully processed or added to `ctx.paths`.

## Targets

We provide optimized, high-performance re-implementations of various CLI/packer matching algorithms in TypeScript. These re-implementations emulate the exact ignore behavior of each target.

### Git ([our implementation](https://github.com/Mopsgamer/view-ignored/tree/main/src/targets/git.ts))

- **Original Algorithm & CLI Logic**: Git uses `dir.c` and standard globbing patterns (defined by its native `wildmatch` spec) to walk files. It resolves configurations starting from `/` (the system's root), loading rules sequentially:
  1. Built-in defaults (such as ignoring `.git/` metadata itself).
  2. Global configuration rules specified by the `core.excludesfile` variable in `~/.gitconfig` or system-wide settings.
  3. Local configuration overrides within `.git/info/exclude`.
  4. Local `.gitignore` files parsed on a per-directory basis.
- **How We Emulate It**: Our target reads `.gitignore` and `.git/info/exclude` configurations, maps global settings via standard paths (`HOME` / `XDG_CONFIG_HOME`), and matches paths with optimized glob rules cached at the module level.
- **Verification CLI Command**: `git ls-files --others --exclude-standard --cached`

### NPM ([our implementation](https://github.com/Mopsgamer/view-ignored/tree/main/src/targets/npm.ts))

- **Original Algorithm & CLI Logic**: The official `npm pack` command relies on `npm-packlist` to list directory contents. It runs a priority-based resolution algorithm:
  1. **Strictly Included**: Essential package files like `package.json`, `README`, `LICENSE`, `LICENCE`, `CHANGES`, and files referenced in package-level configuration fields.
  2. **Inverted Allow-list**: If the `files` array is defined in `package.json`, NPM operates in an inverted matching mode (allowing only matches from `files` plus mandatory files).
  3. **Conditional Exclude**: If no `files` field is defined, it extracts rules from `.npmignore` files, falling back to `.gitignore` files if `.npmignore` is absent.
  4. **Strictly Excluded**: Hardcoded ignores like `node_modules`, VCS directories (`.git`, `.hg`), lockfiles, and debug logs are always skipped.
- **How We Emulate It**: Our target parses the root `package.json` to extract `name`, `version`, and entrypoints (`main`, `module`, `browser`, `bin`), converts target entry paths into exact forced inclusions, and executes priority-ordered cascading glob rules.
- **Verification CLI Command**: `npm pack --dry-run`

### Bun ([our implementation](https://github.com/Mopsgamer/view-ignored/tree/main/src/targets/bun.ts))

- **Original Algorithm & CLI Logic**: Bun's native Rust implementation of the `bun pm pack` command mimics NPM's packing behavior but with subtle differences. It validates the manifest and processes hardcoded inclusions (`package.json`, standard documentation, and `bin` file paths) and excludes lockfiles (like `bun.lockb` and `bun.lock`) and system environments by default.
- **How We Emulate It**: Our target initializes from the root `package.json`, extracting `bin` configurations and enforcing the specific hardcoded defaults mapped inside Bun's Rust packer engine.
- **Verification CLI Command**: `bun pm pack --dry-run`

### Yarn ([our implementation](https://github.com/Mopsgamer/view-ignored/tree/main/src/targets/yarn.ts))

- **Original Algorithm & CLI Logic**: Modern Yarn (Berry) uses `@yarnpkg/plugin-pack` to package workspaces. It applies case-insensitive matching rules to package manifests and standard docs, extracts ignore lists from `.npmignore` and fallback `.gitignore` files, and prevents the packaging of its own workspace metadata (such as `.yarnrc.yml`, `.yarn`, and output `.tgz` files).
- **How We Emulate It**: Our target maps Berry's exact exclude and include lists, parses entry fields, and case-insensitively extracts fallback rules from local ignore manifests.
- **Verification CLI Command**: Runs modern Yarn's workspace packaging checks.

### Yarn Classic ([our implementation](https://github.com/Mopsgamer/view-ignored/tree/main/src/targets/yarnClassic.ts))

- **Original Algorithm & CLI Logic**: Legacy Yarn v1 packs files by evaluating `.yarnignore`, `.npmignore`, and `.gitignore` case-insensitively, alongside standard packing exclusions and a standard case-insensitive allow-list for documentation, license templates, and change logs.
- **How We Emulate It**: Our target matches Classic's specific built-in excludes, performs case-insensitive rule extraction across all supported ignore manifests, and guarantees identical rule evaluation.

### VSCE ([our implementation](https://github.com/Mopsgamer/view-ignored/tree/main/src/targets/vsce.ts))

- **Original Algorithm & CLI Logic**: The `vsce package` tool requires standard workspace fields (`name`, `version`, and `engines.vscode` in `package.json`). It reads `.vscodeignore` patterns, falling back to `.gitignore` when `.vscodeignore` is absent. It automatically ignores non-production templates, administrative Markdown directories (`.github`), linter configuration templates, and testing rigs.
- **How We Emulate It**: Our target validates VS Code engines in the manifest and registers `.vscodeignore` fallback rules over VSCE's predefined default blocklist.
- **Verification CLI Command**: `vsce ls`

### JSR ([our implementation](https://github.com/Mopsgamer/view-ignored/tree/main/src/targets/jsr.ts))

- **Original Algorithm & CLI Logic**: JSR's publishing pipeline reads `jsr.json` or `jsr.jsonc`. It evaluates the fields `publish.include`/`include` and `publish.exclude`/`exclude`. When inclusion rules are present, it acts as an inverted allow-list, while ensuring VCS folders (`.git`) and local OS configurations are skipped.
- **How We Emulate It**: Our target parses JSR configurations, validates the manifest keys, and dynamically toggles target list matching modes.

### Deno ([our implementation](https://github.com/Mopsgamer/view-ignored/tree/main/src/targets/deno.ts))

- **Original Algorithm & CLI Logic**: Deno's publishing system behaves identically to JSR, but searches sequentially for configuration files in the root workspace (`deno.json`, `deno.jsonc`, `jsr.json`, or `jsr.jsonc`) to extract publishing metadata.
- **How We Emulate It**: Our target scans for any of the supported manifest formats and compiles matching publish and exclude rules.

## CLI

A diagnostic utility to hunt for bugs by comparing `view-ignored` results against real system CLIs.

```bash
vign-diff [command] <target> [flags]
```

- **`diff`** (default): Compare against system CLI.
- **`list`**, **`ls`**: List all files included by `view-ignored` with high-precision timing.
- **`-i, --issue`**: Automatically open a prefilled GitHub issue on discrepancy.
- **`-V, --verbose`**: Show raw report.
- **`all`**: Run diagnostics against every supported tool on your system.

```bash
vign-diff git          # Compare against git
vign-diff list npm     # List files for npm package
vign-diff all -i       # Scan all and open issues
```

## See also

- There are references in our implementations.
- https://jsr.io/@m234/path - Utility to sort, convert and format paths.
- https://github.com/git/git/blob/master/wildmatch.c - The original wildmatch implementation.
- https://npmx.dev/package/ignore-walk - A Node.js module for walking directories while respecting ignore files. (It does it incorrectly for Git).
- https://npmx.dev/package/npm-packlist - A Node.js module for listing files to be included in an npm package. (Heavy)

## Benchmarks

See [benchmarks directory](https://github.com/Mopsgamer/view-ignored/tree/main/benchmarks).

## License

MIT License. See [LICENSE.txt](LICENSE.txt) for details.
