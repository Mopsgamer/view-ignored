# view-ignored

[![npm version](https://badge.fury.io/js/view-ignored.svg)](https://www.npmjs.com/package/view-ignored)
[![Downloads](https://img.shields.io/npm/dm/view-ignored.svg)](https://www.npmjs.com/package/view-ignored)

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
viewig scan . --plugins="vign-p-tsx, vign-p-jsdoc"
viewig scan . --plugins="vign-p-tsx vign-p-jsdoc"
viewig scan . --plugins vign-p-tsx vign-p-jsdoc
viewig scan . --plugins vign-p-tsx, vign-p-jsdoc

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
viewig config set plugins=typescript-viewig,eslint-vign-plugin
```

### Programmatically

```js
import * as vign from "view-ignored";
import * as vign from "view-ignored/out/src/browser"; // for web environment apps

const fileInfoList = await vign.scanProject("git");
const fileInfo = await vign.scanFile("./path/to/file", "git");

// options available
const fileInfoList = await vign.scanProject("git", { cwd, ... });

// use results
if (fileInfo.ignored) {
    superCodeEditor.explorer.colorFile(fileInfo.path, "gray");
}
```

#### Sorting

```js
const sorter = vign.Sorting.firstFolders;
const fileInfoList = await vign.scanProject("npm");
const fileInfoSorted = fileInfoList.map(String).sort(sorter);
```

```js
const sorter = vign.Sorting.modified;
const fileInfoList = await vign.scanProject("npm");

const cache = new Map<string, number>(fileInfoList.map(String).map(
    filePath => [filePath, fs.statSync(filePath).mtime.getTime()])
);
const lookedSorted = fileInfoList.sort((a, b) => sorter(a.toString(), b.toString(), cache));
```

### Targets

- `git`
- `npm` (can be usable for PNPM and Bun)
- `yarn`
- `vsce`
- `jsr` *planned*
- `deno` *planned*
