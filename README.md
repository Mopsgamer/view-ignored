<div align="center">
<h1>view-ignored</h1>

[![npm-version](https://img.shields.io/npm/v/view-ignored.svg)](https://www.npmjs.com/package/view-ignored)
[![npm-downloads](https://img.shields.io/npm/dm/view-ignored.svg?color=orange)](https://www.npmjs.com/package/view-ignored)
[![npm-size](https://img.shields.io/npm/unpacked-size/view-ignored.svg)](https://www.npmjs.com/package/view-ignored)
[![coverage](https://codecov.io/gh/Mopsgamer/view-ignored/graph/badge.svg?token=O5I06Y2A86)](https://codecov.io/gh/Mopsgamer/view-ignored)
![node-v22-or-later](https://img.shields.io/badge/node->=22-salad?repo=Mopsgamer/view-ignored.svg)
![ts-v5-or-later](https://img.shields.io/badge/ts->=5.7-salad?repo=Mopsgamer/view-ignored)
[![speed-fast](https://img.shields.io/badge/speed-fast-salad?repo=Mopsgamer/view-ignored.svg)](https://github.com/Mopsgamer/view-ignored/tree/main/benchmarks)
[![npm-packlist-tests](https://img.shields.io/badge/npm--packlist-68%2F68-blue)](https://github.com/Mopsgamer/view-ignored/tree/main/src/test-npm-packlist/)
[![wildmatch-tests](https://img.shields.io/badge/wildmatch-346%2F346-blue)](https://github.com/Mopsgamer/view-ignored/tree/main/src/test-wildmatch/)
[![ignore-tests](https://img.shields.io/badge/ignore-66%2F84-blue)](https://github.com/Mopsgamer/view-ignored/tree/main/src/test-wildmatch/)

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
[![wiki](https://img.shields.io/badge/docs-wiki-blue)](https://github.com/Mopsgamer/view-ignored/wiki)

</div>

## Highlights

- **Reader.** Get included files by parsing configurations directly, without wrapping CLI tools.
- **Reasoning.** Detailed tracing of why specific files are included or excluded with rule-origin paths.
- **Fast & Streaming.** Highly optimized performance with native `scanStream` support for massive file trees.
- **Plugins.** Built-in targets for popular tools + custom target support via the `Target` interface.
- **Execution Control.** Fine-tune traversal with `within`, `depth`, `skipDepth`, `skipInternal`, and standard `AbortSignal`.
- **Browser & Windows.** Fully compatible with browser environments, custom filesystem adapters (`memfs`), and Windows paths.

## Quick Start

```ts
import * as vign from "view-ignored"
import { makeGit } from "view-ignored/targets"

const ctx = await vign.scan({ target: makeGit() })
console.log(ctx.paths.has("src/index.ts")) // true
```

## Documentation & Wiki

All guides, target specifications, scan options, and examples are maintained in our Wiki:

- **[Wiki Home](https://github.com/Mopsgamer/view-ignored/wiki)**
- **Supported Targets**: [Git](https://github.com/Mopsgamer/view-ignored/wiki/Target-Git), [NPM](https://github.com/Mopsgamer/view-ignored/wiki/Target-NPM), [Bun](https://github.com/Mopsgamer/view-ignored/wiki/Target-Bun), [Yarn](https://github.com/Mopsgamer/view-ignored/wiki/Target-Yarn), [Yarn Classic](https://github.com/Mopsgamer/view-ignored/wiki/Target-Yarn-Classic), [VSCE](https://github.com/Mopsgamer/view-ignored/wiki/Target-VSCE), [JSR](https://github.com/Mopsgamer/view-ignored/wiki/Target-JSR), [Deno](https://github.com/Mopsgamer/view-ignored/wiki/Target-Deno), [Custom](https://github.com/Mopsgamer/view-ignored/wiki/Target-Custom)
- **Scan Options**: [`target`](https://github.com/Mopsgamer/view-ignored/wiki/Option-target), [`cwd`](https://github.com/Mopsgamer/view-ignored/wiki/Option-cwd), [`within`](https://github.com/Mopsgamer/view-ignored/wiki/Option-within), [`invert`](https://github.com/Mopsgamer/view-ignored/wiki/Option-invert), [`depth`](https://github.com/Mopsgamer/view-ignored/wiki/Option-depth), [`signal`](https://github.com/Mopsgamer/view-ignored/wiki/Option-signal), [`skipDepth`](https://github.com/Mopsgamer/view-ignored/wiki/Option-skipDepth), [`skipInternal`](https://github.com/Mopsgamer/view-ignored/wiki/Option-skipInternal), [`dirs`](https://github.com/Mopsgamer/view-ignored/wiki/Option-dirs), [`fs`](https://github.com/Mopsgamer/view-ignored/wiki/Option-fs)
- **Guides**: [Pack NPM Tarball](https://github.com/Mopsgamer/view-ignored/wiki/How-to-pack-npm-tar), [Streaming](https://github.com/Mopsgamer/view-ignored/wiki/How-to-use-stream), [Incremental Updates](https://github.com/Mopsgamer/view-ignored/wiki/How-to-use-incremental), [File Watching](https://github.com/Mopsgamer/view-ignored/wiki/How-to-watch-files), [Target Plugin Packages](https://github.com/Mopsgamer/view-ignored/wiki/How-to-create-plugin-public-npm-package), [Contributing Guide](https://github.com/Mopsgamer/view-ignored/wiki/How-to-contribute)
- **CLI Utility**: [`vign-diff` CLI Docs](https://github.com/Mopsgamer/view-ignored/wiki/CLI-vign-diff)

## License

MIT License. See [LICENSE.txt](LICENSE.txt) for details.
