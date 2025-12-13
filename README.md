# view-ignored

[![npm version](https://img.shields.io/npm/v/view-ignored.svg?style=flat)](https://www.npmjs.com/package/view-ignored)
[![npm downloads](https://img.shields.io/npm/dm/view-ignored.svg?style=flat)](https://www.npmjs.com/package/view-ignored)
[![github](https://img.shields.io/github/stars/Mopsgamer/view-ignored.svg?style=flat)](https://github.com/Mopsgamer/view-ignored)
[![github issues](https://img.shields.io/github/issues/Mopsgamer/view-ignored.svg?style=flat)](https://github.com/Mopsgamer/view-ignored/issues)

Retrieve list of files ignored/included by Git, NPM, Yarn, JSR, VSCE or other
tools.

## Requirements

Requires Node.js v18 or later.

## Highlights

- **Native.** Get a list of included files using configuration file
  readers, not command-line wrappers.
- **Plugins.** view-ignored allows you to add new [targets](#targets)
  programmatically.
- **TypeScript.** Written in TypeScript with type definitions included.

> [!NOTE]
> Despite the name of the package being "view-ignored",
> the primary purpose is to get the list of
> **included** files, i.e., files that are **not ignored**.
> You can invert the results if you need the ignored files
> by setting the `invert` option to `true`.

## Usage

```ts
import * as vign from "view-ignored";
import { Git } from "view-ignored/targets";

const results = await vign.scan({ targets: [ Git ] });
const gitResults = results.get(Git)!;

const isGitFolderIncluded = gitResults.paths.has(".git/HEAD");
```

### Targets

The following built-in plugins are available:

- `git`
- `npm` (compatible with Bun, PNPM, and others)
- `yarn`
- `vsce`
- `jsr` (compatible with Deno)

## License

MIT License. See [LICENSE.txt](LICENSE.txt) for details.
