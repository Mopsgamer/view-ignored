# view-ignored

[![npm version](https://badge.fury.io/js/view-ignored.svg)](https://www.npmjs.com/package/view-ignored)
[![Downloads](https://img.shields.io/npm/dm/view-ignored.svg)](https://www.npmjs.com/package/view-ignored)

Retrieve list of files ignored/included by Git, NPM, Yarn and VSC Extension.

## Highlights

- **Multi-target.** Get list of included files, using configuration files reader, not command line wrapper.
- **Use in browser.** view-ignored supports file system adapter.
- **Command line.** Supports no-color and multiple output styles, including [nerd fonts](https://github.com/ryanoasis/nerd-fonts).
- **Plugins.** view-ignored allows you to add new [targets](#targets) programmatically. Command line interface does NOT support plugins.

## Install

```bash
npm i view-ignored
```

## Usage

### Command line

```bash
# get started
npm i -g view-ignored
viewig --help
view-ignored --help

# scan: git (default) and npm
viewig scan .
viewig scan . --target=npm

# config: print all
viewig config get
# config: print with defaults
viewig config get --safe
# config: set npm as default target and scan for npm
viewig config set target=npm
viewig scan .
# config: always use nerd font
viewig config set style=treeNerd
```

### Programmatically

```js
import * as vign from "view-ignored";
import * as vign from "view-ignored/lib/browser"; // for web environment apps

const fileInfoList = vign.scanProject("git");
const fileInfoList = vign.scanPaths(pathList, "git");
const fileInfo = vign.scanFile(pathToFile, "git");

// options available
const fileInfoList = vign.scanProject("git", { cwd, ... });

// custom
/**@type {vign.ScanMethod}*/
export const method = function (data) {
  const { looker, sourceFile: source } = data
  if (!looker.isValidPattern(source.content)) {
      return false
  }
  looker.add(source.content)
  return true
}

/**@type {vign.Source[]}*/
export const sources = [
  { sources: new SourcePattern("**/.gitignore"), patternType: ".*ignore", method, addPatterns: addPatternsExclude },
]
vign.scanProject(sources)

// use results
if (fileInfo.ignored) {
  vscode.explorer.colorFile(fileInfo.filePath, "gray")
}
```

#### Sorting:

```js
const fileInfoList = vign.scanProject("npm");
const sorter = vign.Sorting.Sorters.firstFolders;
fileInfoList.map(String).sort(sorter);
```

```js
const fileInfoList = vign.scanProject("npm")
const sorter = Sorting.Sorters[flags.sort]
const cacheEditDates = new Map<FileInfo, Date>()
for (const look of looked) {
	cacheEditDates.set(look, fs.statSync(look.filePath).mtime)
}
const lookedSorted = looked.sort((a, b) => sorter(
	a.toString(), b.toString(),
	cacheEditDates.get(a)!, cacheEditDates.get(b)!
))
```

### Targets

- `git`
  - Test command: `git ls-tree -r <git-branch-name> --name-only`
  - Sources walkthrough: '.gitignore' and git config `core.excludesFile`.
  - `core.excludesFile` does not work at this moment.
- `npm` (can be usable for PNPM and Bun)
  - Test command: `npm pack --dry-run`
  - Sources walkthrough: 'package.json'>"files" otherwise '.npmignore' otherwise '.gitignore'.
- `yarn`
  - Sources walkthrough: 'package.json'>"files" otherwise '.yarnignore' otherwise '.npmignore' otherwise '.gitignore'.
- `vsce`
  - Test command: `vsce ls`
  - Sources walkthrough: '.vscodeignore'.
