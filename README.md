<div align="center">
<h1>view-ignored</h1>

[![npm version](https://img.shields.io/npm/v/view-ignored.svg)](https://www.npmjs.com/package/view-ignored)
[![npm downloads](https://img.shields.io/npm/dm/view-ignored.svg)](https://www.npmjs.com/package/view-ignored)
![node-v-18-or-later](https://img.shields.io/badge/node->=18-salad?repo=Mopsgamer/view-ignored)
[![speed-fast](https://img.shields.io/badge/speed-fast-salad?repo=Mopsgamer/view-ignored)](https://github.com/Mopsgamer/view-ignored/tree/main/benchmarks)

[![github issues](https://img.shields.io/github/issues/Mopsgamer/view-ignored.svg)](https://github.com/Mopsgamer/view-ignored/issues)
[![github](https://img.shields.io/github/stars/Mopsgamer/view-ignored.svg)](https://github.com/Mopsgamer/view-ignored)

Retrieve list of files ignored/included
by Git, NPM, Yarn, JSR, Deno, Bun, VSCode extension CLI and other tools.

---

### `view-ignored` scans for

<img src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/git/git-original.svg" width="32" height="32" alt="git" />
<img src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/npm/npm-original-wordmark.svg" width="32" height="32" alt="npm" />
<img src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/yarn/yarn-original.svg" width="32" height="32" alt="yarn" />
<img src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/bun/bun-original.svg" width="32" height="32" alt="bun" />
<img src="https://unpkg.com/simple-icons@v14/icons/deno.svg" width="32" height="32" alt="deno" />
<img src="https://jsr.io/logo.svg" width="32" height="32" alt="jsr" />
<img src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/vscode/vscode-original.svg" width="32" height="32" alt="vsce" />

and more!

[![issues](https://img.shields.io/github/issues-search?query=repo%3AMopsgamer%2Fview-ignored%20label%3Atargets%20type%3Aissue&label=issues)](https://github.com/search?q=repo%3AMopsgamer%2Fview-ignored+label%3Atargets+type%3Aissue&type=issues&query=repo%3AMopsgamer%2Fview-ignored+label%3Atargets)
[![suggest](https://img.shields.io/badge/suggest-salad?repo=Mopsgamer/view-ignored)](https://github.com/Mopsgamer/view-ignored/issues/new)
[![details](https://img.shields.io/badge/details-gray?repo=Mopsgamer/view-ignored)](#targets)

</div>

## Highlights

<!-- - **Faster alternative for `npm-packlist`, `ignore-walk` and `ignore`.** -->

- **Reader.** Get a list of included files using configuration file
  readers, not command-line wrappers.
- **Reasoning.** Understand why certain files are included or excluded.
- **Fast.** Optimized for performance with minimal memory overhead.
- **Plugins.** Built-in [targets](#targets) for popular tools. Use custom
  targets by implementing/extending the `Target` interface.
- **Streaming.** Native `scanStream` support for processing massive file trees with minimal memory overhead.
- **Execution Control.** Use `fastDepth` and `fastInternal` options to fine-tune traversal depth and skip unnecessary directory checks. You can also enable them if you don't care about stats.
- **Abortable.** Full support for `AbortSignal` to cancel long-running scans instantly.
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

- [x] Works for common use cases.
- [ ] Follow `.gitignore` spec. (`ignore` does.)
- [ ] Handle Git config.
- [ ] Include node_modules bundled dependencies correctly. Missing: NPM, Yarn + Classic, Bun, Deno, JSR.
- [ ] \*Move targets into separate packages (or not).
- [ ] Import and pass upstream source tests.
- [ ] \*Make it standard: NPM cli, VS Code file tree, VSCE, GitHub.
- [ ] \*Upstream to Bun, PNPM and other package managers.

<sub>\* - Optional.</sub>

## Why this library exists?

Incorrect VS Code file tree git status, huge `npm-packlist` package, missing Git's wildmatch algorithm in JS ecosistem, and the fact that there's no lightweight way to get a list of ignored files, which would explain why specific files are being included or excluded.

## Usage

### Basic example

```ts
import * as vign from "view-ignored"
// also available:
// "/scan", "/stream"
// "/browser", "/browser/scan", "/browser/stream"
import { Git as target } from "view-ignored/targets"

const ctx = await vign.scan({ target })
ctx.paths.has(".git/HEAD") // false
ctx.paths.has("src") // true

const match = ctx.paths.get("src")
if (match.kind === "external") {
	console.log(match.source.path) // ".gitignore"
	console.log(match.pattern) // "src/**"
}
```

### Using custom target

This is the internal implementation for the Git target:

```ts
import type { Target } from "view-ignored/targets"

import {
	type Extractor,
	extractGitignore,
	ruleTest,
	ruleCompile,
	type Rule,
} from "view-ignored/patterns"

const extractors: Extractor[] = [
	{
		extract: extractGitignore,
		path: ".gitignore",
	},
	{
		extract: extractGitignore,
		path: ".git/info/exclude",
	},
]

const internal: Rule[] = [
	ruleCompile({
		compiled: null,
		excludes: true,
		pattern: [".git", ".DS_Store"],
	}),
]

export const Git: Target = <Target>{
	extractors,
	// TODO: Git should read configs
	ignores: ruleTest,
	internalRules: internal,
	root: "/",
}
```

### Streaming results

```ts
import * as vign from "view-ignored"
// or import * as vign from "view-ignored/stream"
import { NPM as target } from "view-ignored/targets"

const stream = vign.scanStream({ target })

stream.addEventListener("dirent", console.log)
stream.addEventListener(
	"end",
	(ctx) => {
		ctx.paths.has(".git/HEAD")
		// false
		ctx.paths.has("node_modules/")
		// false
		ctx.paths.has("package.json")
		// true
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
// or view-ignored/browser/scan
import { Git as target } from "view-ignored/targets"

export const cwd = process.cwd()
const customFs = { readdir, readFile }
vign.scan({ target, cwd, fs })
```

## Targets

The following built-in scanners are available:

- Git ([our implementation](https://github.com/Mopsgamer/view-ignored/tree/main/src/targets/git.ts))
  - `view-ignored` handles Git-specific ignoring almost identically to Git: does not consider config.
  - Reads `.gitignore` and `.git/info/exclude`.
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
