# view-ignored

[![npm version](https://img.shields.io/npm/v/view-ignored.svg?style=flat)](https://www.npmjs.com/package/view-ignored)
[![npm downloads](https://img.shields.io/npm/dm/view-ignored.svg?style=flat)](https://www.npmjs.com/package/view-ignored)
[![github](https://img.shields.io/github/stars/Mopsgamer/view-ignored.svg?style=flat)](https://github.com/Mopsgamer/view-ignored)
[![github issues](https://img.shields.io/github/issues/Mopsgamer/view-ignored.svg?style=flat)](https://github.com/Mopsgamer/view-ignored/pulls)

Retrieve list of files ignored/included by Git, NPM, Yarn and VSC Extension.

## Highlights

- **Multi-target.** Get list of included files, using configuration files reader, not command-line wrapper.
- **Use in browser.** view-ignored supports file system adapter.
- **Command-line.** Supports no-color and multiple output styles, including [nerd fonts](https://github.com/ryanoasis/nerd-fonts).
- **Plugins.** view-ignored allows you to add new [targets](#targets) programmatically. Command-line interface supports plugins throught `--plugin` option.

## Install

```bash
npm i view-ignored
```

## Usage

### Command-line

```bash
# get started
npm i -g view-ignored
viewig --help
view-ignored --help

# scan: git (default) and npm
viewig scan .
viewig scan . --target=npm
viewig scan . --parsable

# scan: plugins (space, comma or pipe separated)
# all built-in plugins loaded automatically
viewig scan . --plugins="example1, example2"
viewig scan . --plugins="example1 example2"
viewig scan . --plugins example1 example2
viewig scan . --plugins example1, example2

# config: print configuration entries
viewig config get
viewig config get --real
# config: set npm as default target and scan for npm
viewig config set target=npm
viewig scan .
# config: always use nerdfonts
viewig config set style=tree
# config: always use nerdfonts
viewig config set decor=nerdfonts
# config: always use plugins
viewig config set plugins=example1,example2
```

### Programmatically

All you need it to add

```js
import * as vign from "view-ignored"; // or "view-ignored/browser"

await vign.Plugins.loadBuiltIns(["git", "npm"]); // load built-in plugins
await vign.Plugins.loadBuiltIns(); // load all built-in plugins
await vign.Plugins.loadPlugins(["example"]); // load third-party plugins

// scan - options available
const fileInfoList = await vign.scan(".", { target: "git", cwd: process.cwd() });
const fileInfoList = await vign.scan(["./path/to/file"], { target: "git", process.cwd() });

// use results
if (fileInfo.ignored) {
    superCodeEditor.explorer.colorFile(fileInfo.relativePath, "gray");
}
```

#### Sorting

```js
const sorter = vign.Sorting.firstFolders;
const fileInfoList = await vign.scan(".", {target: "npm"});
const fileInfoSorted = fileInfoList.sort((a, b) => sorter(String(a), String(b)));
```

### Targets

- `git`
- `npm` (use it for PNPM and Bun)
- `yarn`
- `vsce`
- `jsr` *planned*
- `deno` *planned*
