# view-ignored

[![npm version](https://badge.fury.io/js/view-ignored.svg)](https://www.npmjs.com/package/view-ignored)

Retrieve list of files ignored/included by Git, npm, Yarn and VSC Extension.

## Install

```bash
npm i -g view-ignored
```

## Highlights

- **Multi-target.** Get list of included files, using configuration files reader, not command line wrapper.
- **Use in browser.** view-ignored supports file system adapter.
- **Command line.** Supports no-color and multiple output styles, including [nerd fonts](https://github.com/ryanoasis/nerd-fonts).
- **Plugins.** API allows to add new [targets](#targets) programmatically. Command line interface does NOT support plugins.

### Targets

- `git`
  - Check: `git ls-tree -r <git-branch-name> --name-only`
  - Sources walkthrough: '.gitignore' and git config `core.excludesFile`.
- `npm` (btw usable for PNPM and Bun)
  - Check: `npm pack --dry-run`
  - Sources walkthrough: 'package.json' otherwise '.npmignore' otherwise '.gitignore'.
- `yarn`
  - Sources walkthrough: 'package.json' otherwise '.yarnignore' otherwise '.npmignore' otherwise '.gitignore'.
- `vsce`
  - Check: `vsce ls`
  - Sources walkthrough: '.vscodeignore' otherwise '.gitignore'.

### Usage

```js
import * as vign from "view-ignored";
import * as vign from "view-ignored/lib/browser"; // for web environment apps

const looked = vign.scanProject("git");
```

Sorting:

```js
const looked = vign.scanProject("npm");
const sorter = vign.Sorting.Sorters.firstFolders;
looked.map(String).sort(sorter);
```

```js
const looked = vign.scanProject("npm")
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

#### Command line.

```bash
npm i -g view-ignored
viewig --help
view-ignored --help

viewig scan . --target=npm
```
