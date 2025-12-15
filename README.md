# view-ignored

[![npm version](https://img.shields.io/npm/v/view-ignored.svg?style=flat)](https://www.npmjs.com/package/view-ignored)
[![npm downloads](https://img.shields.io/npm/dm/view-ignored.svg?style=flat)](https://www.npmjs.com/package/view-ignored)
[![github](https://img.shields.io/github/stars/Mopsgamer/view-ignored.svg?style=flat)](https://github.com/Mopsgamer/view-ignored)
[![github issues](https://img.shields.io/github/issues/Mopsgamer/view-ignored.svg?style=flat)](https://github.com/Mopsgamer/view-ignored/issues)

Retrieve list of files ignored/included
by Git, NPM, Yarn, JSR, VSCE or other tools.

## Requirements

- Node.js 18 or later for production
- Node.js 20 or later for production type definitions
- Node.js 22 or later for development type definitions

## Highlights

- **Native.** Get a list of included files using configuration file
  readers, not command-line wrappers.
- **Plugins.** Built-in [targets](#targets) for popular tools. Use custom
  targets by implementing the `Target` interface.
- **TypeScript.** Written in TypeScript with type definitions included.
- **Lightweight.** Minimal dependencies for fast performance and small bundle size.
- **Easy-to-modify.** Well-written and MIT-licensed.

> [!NOTE]
> Despite the name of the package being "view-ignored",
> the primary purpose is to get the list of
> **included** files, i.e., files that are **not ignored**.
> You can invert the results if you need the ignored files
> by setting the `invert` option to `true`.

## Usage

### Basic example

```ts
import * as vign from "view-ignored";
import { Git } from "view-ignored/targets";

const results = await vign.scan({ target: Git });
results.paths.has(".git/HEAD");
```

### Using custom target

```ts
import * as vign from "view-ignored";
import {
  type SourceExtractor,
  type SignedPattern,
  extractGitignore
  findAndExtract,
  signedPatternIgnores,
} from "view-ignored/patterns";
import type { Target } from "view-ignored/targets";

const gitSources = ['.gitignore'];
const gitSourceMap = new Map<string, SourceExtractor>([
  ['.gitignore', extractGitignore]
]);
const gitPattern: SignedPattern = {
  exclude: [
    '.git',
    '.DS_Store',
  ],
  include: []
};

export const Git: Target = {
  async matcher(entry, isDir, ctx) {
    if (isDir) {
      await findAndExtract(entry, gitSources, gitSourceMap, ctx);
      return true;
    }
    return await signedPatternIgnores(gitPattern, entry, gitSources, gitSourceMap, ctx);
  }
};
```

```ts
vign.scan({ target: Git });
```

## Targets

> [!NOTE]
> Each scanner expects minimal configurations, but the actual tool can have
> more/less complex rules. Refer to the documentation of each tool for details.

The following built-in scanners are available:

- Git
  - Reads `.gitignore` files but does not consider global settings.
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
  - Reads `.vscodeignore` and `package.json` `files` field.
  - Check this scanner by running `vsce ls`.
  - See the implementation of [VSCE target](https://github.com/Mopsgamer/view-ignored/tree/main/src/targets/vsce.ts) for details.
- JSR (compatible with Deno)
  - Reads `jsr.json(c)` and `deno.json(c)` `include` and `exclude` fields.
  - See the implementation of [JSR target](https://github.com/Mopsgamer/view-ignored/tree/main/src/targets/jsr.ts) for details.

## License

MIT License. See [LICENSE.txt](LICENSE.txt) for details.
