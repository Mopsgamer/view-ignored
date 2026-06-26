<div align="center">
<h1>view-ignored</h1>

[![npm-version](https://img.shields.io/npm/v/view-ignored.svg)](https://www.npmjs.com/package/view-ignored)
[![npm-downloads](https://img.shields.io/npm/dm/view-ignored.svg?color=orange)](https://www.npmjs.com/package/view-ignored)
[![coverage](https://codecov.io/gh/Mopsgamer/view-ignored/graph/badge.svg?token=O5I06Y2A86)](https://codecov.io/gh/Mopsgamer/view-ignored)
![node-v22-or-later](https://img.shields.io/badge/node->=22-salad?repo=Mopsgamer/view-ignored.svg)
![ts-v5-or-later](https://img.shields.io/badge/ts->=5.7-salad?repo=Mopsgamer/view-ignored)
[![speed-fast](https://img.shields.io/badge/speed-fast-salad?repo=Mopsgamer/view-ignored.svg)](https://github.com/Mopsgamer/view-ignored/tree/main/benchmarks)

<!-- marker: npm-packlist tests -->
[![npm-packlist-tests](https://img.shields.io/badge/npm--packlist-0%2F68-blue)](src/test-npm-packlist/)

Retrieve list of files ignored/included
by Git, NPM, Yarn, JSR, Deno, Bun, VSCode extension CLI and other tools.

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

- **Reader.** Get a list of included files using configuration file
  readers, not command-line wrappers.
- **Reasoning.** Understand why certain files are included or excluded.
- **Fast.** Optimized for performance with minimal memory overhead.
- **Plugins.** Built-in [targets](#targets) for popular tools. Use custom
  targets by implementing/extending the `Target` interface.
- **Streaming.** Native `scanStream` support for processing massive file trees with minimal memory overhead.
- **Execution Control.** Use `fastDepth` and `fastInternal` options to fine-tune traversal depth and skip unnecessary directory checks. You can enable them if you don't care about stats. Full support for `AbortSignal` to cancel long-running scans instantly.
- **Lightweight.** Minimal dependencies for fast performance and small bundle size.
- **Browser.** Can be bundled for browser use.
- **Windows.** Windows paths are converted to Unix paths for compatibility with `memfs` based tests and browsers.

> [!NOTE]
> Despite the name of the package being "view-ignored",
> the primary purpose is to get the list of
> **included** files, i.e., files that are **not ignored**.
> You can invert the results if you need the ignored files
> by setting the `invert` option to `true`.

## v1 Roadmap

- [x] Perfect API.
- [x] Works for common use cases.
- [ ] Follow `.gitignore` spec. (`ignore` does.)
- [ ] Handle Git config.
- [ ] Include node_modules bundled dependencies correctly. Missing: NPM, Yarn + Classic, Bun, Deno, JSR.
- [ ] Import and pass upstream source tests.
- [ ] \*Move targets into separate packages.

<sub>\* - Optional.</sub>

## Why this library exists?

Incorrect VS Code file tree git status, huge `npm-packlist` package, missing Git's wildmatch algorithm in JS ecosystem, and the fact that there's no lightweight way to get a list of ignored files, which would explain why specific files are being included or excluded.

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

### Using custom target

You can create custom targets by implementing the `Target` interface.
This is an example for a Docker-like target:

```ts
import type { Target } from "view-ignored/targets"

import {
	type Extractor,
	extractGitignore,
	ruleTest,
	ruleCompile,
	type InternalRules,
} from "view-ignored/patterns"

export function makeDocker(): Target {
	const extractors: Extractor[] = [
		{
			extract: extractGitignore,
			path: ".dockerignore",
		},
	]

	const internal: InternalRules = {
		before: [
			ruleCompile({
				compiled: null,
				excludes: true,
				pattern: [".git/", "node_modules/", ".DS_Store"],
			}),
		],
		after: [],
	}

	return {
		extractors,
		ignores: ruleTest,
		internalRules: internal,
		needsSource: false, // .dockerignore is optional
		root: ".",
	}
}
```

### Streaming results

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

### Browser and custom FS

To avoid imports from `node:fs` and `node:process` modules,
use the browser submodule, which requires some additional options.

```ts
import * as vign from "view-ignored/browser"
// or "/browser/scan"
import { makeGit } from "view-ignored/targets"
import { readFile, readdir } from "original-fs"

export const cwd = process.cwd()
const customFs = { readFile, readdir }
await vign.scan({ cwd, fs: customFs, target: makeGit() })
```

### Watching for changes

You can use patchers to update the `MatcherContext` without rescanning the entire tree.
This is useful for implementing file watchers.

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

The following built-in scanners are available:

- Git ([our implementation](https://github.com/Mopsgamer/view-ignored/tree/main/src/targets/git.ts))
  - `view-ignored` handles Git-specific ignoring identically to Git.
  - Reads `.gitignore` and `.git/info/exclude` and configurations.
  - Searches from `/`. (system's root)
  - Check this scanner by running `git ls-files --others --exclude-standard --cached`.
- NPM ([our implementation](https://github.com/Mopsgamer/view-ignored/tree/main/src/targets/npm.ts))
  - `view-ignored` should be compatible with NPM, PNPM, and others.
  - Reads `package.json` `files` field or `.npmignore` or `.gitignore`.
  - Searches from `.` (current working directory).
  - Requires `package.json`: `name`, `version`.
  - Check this scanner by running `npm pack --dry-run`.
- Bun ([our implementation](https://github.com/Mopsgamer/view-ignored/tree/main/src/targets/bun.ts))
  - Bun tries to mimic NPM, but that does not mean it behaves the same way.
  - Searches from `.` (current working directory).
  - Requires `package.json`: `name`, `version`. Forces paths from `bin` to be included.
  - Check this scanner by running `bun pm pack --dry-run`.
- Yarn ([our implementation](https://github.com/Mopsgamer/view-ignored/tree/main/src/targets/yarn.ts))
  - Modern Berry and ZPM behavior. `YarnClassic` is available. ([our implementation](https://github.com/Mopsgamer/view-ignored/tree/main/src/targets/yarnClassic.ts))
  - Reads `package.json` `files` field or `.npmignore` or `.gitignore`.
  - Searches from `.` (current working directory).
  - Requires `package.json`: `name`, `version`. Forces paths from `main`, `module`, `browser` and `bin` to be included.
- VSCE ([our implementation](https://github.com/Mopsgamer/view-ignored/tree/main/src/targets/vsce.ts))
  - Reads `package.json` `files` field or `.vscodeignore` or `.gitignore`.
  - Searches from `.` (current working directory).
  - Requires `package.json`: `name`, `version`, `engines.vscode`.
  - Check this scanner by running `vsce ls`.
- JSR ([our implementation](https://github.com/Mopsgamer/view-ignored/tree/main/src/targets/jsr.ts))
  - Searches from `.` (current working directory).
  - Requires `jsr.json` or `jsr.jsonc`.
  - Validates `publish.include` and `publish.exclude` or `include` and `exclude` fields.
- Deno ([our implementation](https://github.com/Mopsgamer/view-ignored/tree/main/src/targets/deno.ts))
  - Searches from `.` (current working directory).
  - Requires `jsr.json` or `jsr.jsonc` or `deno.json` or `deno.jsonc`.
  - Validates `publish.include` and `publish.exclude` or `include` and `exclude` fields.

## CLI Utility (`vign-diff`)

A diagnostic utility to hunt for bugs by comparing `view-ignored` results against real system CLIs.

```bash
vign-diff [diff|list] [target] [-i] [-V]
```

- **`diff`**: Compare against system CLI (e.g., `git`, `npm`, `bun`, `vsce`, `deno`, `jsr`, `yarn`).
- **`list`**: List all files included by `view-ignored` with high-precision timing.
- **`-i, --issue`**: Automatically open a prefilled GitHub issue on discrepancy.
- **`all`**: Run diagnostics against every supported tool on your system.

```bash
vign-diff git          # Compare against git
vign-diff list npm     # List files for npm package
vign-diff all -i       # Scan all and open issues for any bugs found
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
