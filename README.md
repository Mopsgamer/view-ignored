# view-ignored

[![npm version](https://img.shields.io/npm/v/view-ignored.svg?style=flat)](https://www.npmjs.com/package/view-ignored)
[![npm downloads](https://img.shields.io/npm/dm/view-ignored.svg?style=flat)](https://www.npmjs.com/package/view-ignored)
[![github](https://img.shields.io/github/stars/Mopsgamer/view-ignored.svg?style=flat)](https://github.com/Mopsgamer/view-ignored)
[![github issues](https://img.shields.io/github/issues/Mopsgamer/view-ignored.svg?style=flat)](https://github.com/Mopsgamer/view-ignored/issues)

Retrieve list of files ignored/included by Git, NPM, Yarn, JSR, VSCE or other
tools.

## Requirements

Requires Node.js vXX or later.

## Highlights

- **Multi-target.** Get a list of included files using configuration file
  readers, not command-line wrappers.
- **Use in browser.** view-ignored can run in the browser using a file system
  adapter.
- **Command-line.** Supports no-color and multiple output styles (tree, list,
  parsable, etc.), including
  [Nerd Fonts](https://github.com/ryanoasis/nerd-fonts).
- **Plugins.** view-ignored allows you to add new [targets](#targets)
  programmatically. Command-line interface supports plugins through `--plugins`
  option.

## Install

```bash
npm i view-ignored
```

TypeScript types are included.

## Usage

### Command-line

After installing globally, you can use the following commands:

```bash
# get started
npm i -g view-ignored
viewig --help
view-ignored --help

# scan: git (default) and npm
viewig scan
viewig scan --target=npm
viewig scan --parsable

# scan: plugins (space, comma or pipe separated)
# all built-in plugins loaded automatically
# Replace example1/example2 with real plugin names
viewig scan --plugins="example1, example2"
viewig scan --plugins="example1 example2"
viewig scan --plugins example1 example2
viewig scan --plugins example1, example2

# config: print configuration entries
viewig config get
viewig config get --real
# config: set npm as default target and scan for npm
viewig config set target=npm
viewig scan
# config: always use nerdfonts
viewig config set style=tree
# config: always use Nerd Fonts for decoration
viewig config set decor=nerdfonts
# config: always use plugins
viewig config set plugins=example1,example2
```

### Programmatically

To use programmatically:

```js
import * as vign from "view-ignored"; // or "view-ignored/browser"

await vign.Plugins.loadBuiltIns(["git", "npm"]); // load built-in plugins
await vign.Plugins.loadBuiltIns(); // load all built-in plugins
await vign.Plugins.loadPlugins(["example"]); // load third-party plugins

// scan - options available
const fileInfoList = await vign.scan(".", {
  target: "git",
  cwd: process.cwd(),
});
const fileInfoList2 = await vign.scan(["./path/to/file"], {
  target: "git",
  cwd: process.cwd(),
});

// use results
for (const fileInfo of fileInfoList) {
  if (fileInfo.ignored) {
    superCodeEditor.explorer.colorFile(fileInfo.relativePath, "gray");
  }
}
```

#### Sorting

```js
const sorter = vign.Sorting.firstFolders;
const fileInfoList = await vign.scan(".", { target: "npm" });
const fileInfoSorted = fileInfoList.sort((a, b) =>
  sorter(String(a), String(b))
);
```

#### Plugin export example

```ts
const bind: Plugins.TargetBind = {
  id,
  icon,
  name,
  testCommand,
  scanOptions: {
    target: methodologyGitignoreLike(".gitignore"),
  },
};
const git: Plugins.PluginExport = { viewignored: { addTargets: [bind] } };
export default git;
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
