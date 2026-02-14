# view-ignored

[![npm version](https://img.shields.io/npm/v/view-ignored.svg?style=flat)](https://www.npmjs.com/package/view-ignored)
[![npm downloads](https://img.shields.io/npm/dm/view-ignored.svg?style=flat)](https://www.npmjs.com/package/view-ignored)
[![github](https://img.shields.io/github/stars/Mopsgamer/view-ignored.svg?style=flat)](https://github.com/Mopsgamer/view-ignored)
[![github issues](https://img.shields.io/github/issues/Mopsgamer/view-ignored.svg?style=flat)](https://github.com/Mopsgamer/view-ignored/issues)

Retrieve list of files ignored/included
by Git, NPM, Yarn, JSR, VSCE or other tools.

## Requirements

Node.js 18 or later

## Highlights

- **Reader.** Get a list of included files using configuration file
  readers, not command-line wrappers.
- **Plugins.** Built-in [targets](#targets) for popular tools. Use custom
  targets by implementing/extending the `Target` interface.
- **TypeScript.** Written in TypeScript with type definitions included.
- **Lightweight.** Minimal dependencies for fast performance and small bundle size.
- **Easy-to-modify.** Well-written and MIT-licensed.
- **Browser.** Can be bundled for browser use. See `ScanOptions.fs` and `import ... "view-ignored/browser"`.
- **Windows.** Windows paths are converted to Unix paths for compatibility with `memfs` based tests and browsers.

> [!NOTE]
> Despite the name of the package being "view-ignored",
> the primary purpose is to get the list of
> **included** files, i.e., files that are **not ignored**.
> You can invert the results if you need the ignored files
> by setting the `invert` option to `true`.

## Usage

### Basic example

```ts
import * as vign from "view-ignored"
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

```ts
import {
	type Extractor,
	extractGitignore,
	signedPatternIgnores,
	signedPatternCompile,
	type SignedPattern,
} from "view-ignored/patterns"

import type { Target } from "view-ignored/targets"

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

const internal: SignedPattern = {
	exclude: [".git", ".DS_Store"],
	include: [],
	compiled: null,
}

signedPatternCompile(internal)

export const Git: Target = {
	extractors,
	ignores(o) {
		return signedPatternIgnores({
			...o,
			internal,
			root: "/",
			target: Git,
		})
	},
}

const ctx = await vign.scan({ target })
```

### Streaming results

```ts
import * as vign from "view-ignored"
import { NPM as target } from "view-ignored/targets"

const stream = await vign.scanStream({ target })

stream.on("dirent", console.log)
stream.on("end", (ctx) => {
	ctx.paths.has(".git/HEAD") // false
	ctx.paths.has("node_modules/") // false
	ctx.paths.has("package.json") // true
})
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

const customFs = {
	promises: {
		opendir,
		readFile,
	},
}

vign.scan({ target, cwd, fs })
```

## Targets

> [!NOTE]
> Each scanner expects minimal configurations, but the actual tool can have
> more/less complex rules. Refer to the documentation of each tool for details.

The following built-in scanners are available:

- Git
  - Reads `.gitignore` and `.git/info/exclude` but does not consider global settings.
  - Starts searching from `/`.
  - Check this scanner by running `git ls-files --others --exclude-standard --cached`.
  - See the implementation of [Git target](https://github.com/Mopsgamer/view-ignored/tree/main/src/targets/git.ts) for details.
- NPM (expecting to be compatible with Bun, PNPM, and others)
  - Reads `.npmignore` and `package.json` `files` field.
  - Starts searching from `.` (current working directory).
  - No additional checks for `name`, `version` or `publishConfig`.
  - Check this scanner by running `npm pack --dry-run`.
  - See the implementation of [NPM target](https://github.com/Mopsgamer/view-ignored/tree/main/src/targets/npm.ts) for details.
- Yarn
  - Modern Berry behavior, but does not include paths from `package.json` `main`, `module`, `browser` and `bin`.
  - `YarnClassic` is available.
  - Starts searching from `.` (current working directory).
  - See the implementation of [Yarn target](https://github.com/Mopsgamer/view-ignored/tree/main/src/targets/yarn.ts) for details.
- VSCE
  - Reads `package.json` `files` field, `.vscodeignore` and `.gitignore`.
  - Starts searching from `.` (current working directory).
  - Check this scanner by running `vsce ls`.
  - See the implementation of [VSCE target](https://github.com/Mopsgamer/view-ignored/tree/main/src/targets/vsce.ts) for details.
- JSR (compatible with Deno)
  - Reads `jsr.json(c)` and `deno.json(c)` `include` and `exclude` fields.
  - Starts searching from `.` (current working directory).
  - See the implementation of [JSR target](https://github.com/Mopsgamer/view-ignored/tree/main/src/targets/jsr.ts) for details.

## See also

- https://jsr.io/@m234/path - Utility to sort, convert and format paths.

## License

MIT License. See [LICENSE.txt](LICENSE.txt) for details.
