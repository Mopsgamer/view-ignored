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
  targets by implementing the `Target` interface.
- **TypeScript.** Written in TypeScript with type definitions included.
- **Lightweight.** Minimal dependencies for fast performance and small bundle size.
- **Easy-to-modify.** Well-written and MIT-licensed.
- **Broswer.** Can be bundled for browser use. See `ScanOptions.fs` and `import ... "view-ignored/browser"`.

> [!NOTE]
> Despite the name of the package being "view-ignored",
> the primary purpose is to get the list of
> **included** files, i.e., files that are **not ignored**.
> You can invert the results if you need the ignored files
> by setting the `invert` option to `true`.

## Plans

- While v0.4 was highly experimental, it introduced some mess without enough useful features.
- v0.5 was a rewrite, but lacked tests due to missing features in `memfs`. It's not fully functional, though some users might rely on it (with caution).
- v0.6 brings new features: optimization options, improved support for Node 18 and browsers, and adds some tests. The library works at least half of the time, but can't guarantee the streaming API or all targets are reliable yet.
- The goal is for v0.7 or a v0.6.x release to deliver a fully tested project. After that, the library will be stabilized and released as v1.0.0.

## Usage

### Basic example

```ts
import * as vign from "view-ignored"
import { Git as target } from "view-ignored/targets"

const ctx = await vign.scan({ target })
ctx.paths.has(".git/HEAD") // false
ctx.paths.has("src") // true
```

### Using custom target

```ts
import type { Target } from "view-ignored/targets"
import {
	type Extractor,
	type SignedPattern,
	signedPatternIgnores,
	extractGitignore,
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

const internal: SignedPattern = {
	exclude: [".git", ".DS_Store"],
	include: [],
	compiled: null,
}

signedPatternCompile(internal)

export const Git: Target = {
	ignores(fs, cwd, entry, ctx) {
		return signedPatternIgnores({
			fs,
			internal,
			ctx,
			cwd,
			entry,
			extractors,
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
```

### Browser and custom FS

To avoid imports from `node:fs` and `node:process` modules,
use the browser submodule, which requires some additional options.

```ts
import * as vign from "view-ignored/browser"
// or view-ignored/browser/scan
import { Git as target } from "view-ignored/targets"

export const cwd = cwd().replace(/\w:/, "").replaceAll("\\", "/")

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
  - Reads `.gitignore` and `.git/info/exclude` files but does not consider global settings.
  - Check this scanner by running `git ls-tree -r HEAD --name-only`.
  - See the implementation of [Git target](https://github.com/Mopsgamer/view-ignored/tree/main/src/targets/git.ts) for details.
- NPM (compatible with Bun, PNPM, and others)
  - Reads `.npmignore` and `package.json` `files` field.
  - No additional checks for `name`, `version` or `publishConfig`.
  - Check this scanner by running `npm pack --dry-run`.
  - See the implementation of [NPM target](https://github.com/Mopsgamer/view-ignored/tree/main/src/targets/npm.ts) for details.
- Yarn
  - Same behavior as `npm`, but also reads `.yarnignore`.
  - See the implementation of [Yarn target](https://github.com/Mopsgamer/view-ignored/tree/main/src/targets/yarn.ts) for details.
- VSCE
  - Reads `package.json` `files` field, `.vscodeignore` and `.gitignore`.
  - Check this scanner by running `vsce ls`.
  - See the implementation of [VSCE target](https://github.com/Mopsgamer/view-ignored/tree/main/src/targets/vsce.ts) for details.
- JSR (compatible with Deno)
  - Reads `jsr.json(c)` and `deno.json(c)` `include` and `exclude` fields.
  - See the implementation of [JSR target](https://github.com/Mopsgamer/view-ignored/tree/main/src/targets/jsr.ts) for details.

## See also

- https://jsr.io/@m234/path - Utility to sort paths.

## License

MIT License. See [LICENSE.txt](LICENSE.txt) for details.
