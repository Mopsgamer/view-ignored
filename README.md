# view-ignored

[![npm version](https://badge.fury.io/js/view-ignored.svg)](https://www.npmjs.com/package/view-ignored)

Retrieve lists of files ignored by Git, npm, Yarn and VSC Extension.

## Install

```bash
npm i view-ignored
```

## Highlights

- **Multi-target.** Get list of included files (ls-tree), using configuration files. view-ignored provides multiple [targets](#targets).
- **Use in browser.** view-ignored supports file system adapter like FastGlob.
- **Command line.** Supports no-color and multiple output styles, including [nerd fonts](https://github.com/ryanoasis/nerd-fonts).

### Targets

- `git`
    - Check: `git ls-tree -r <git-branch-name> --name-only`
    - Sources walkthrough: '.gitignore' and git config `core.excludesFile`.
- `npm`
    - Check: `npm pack --dry-run`
    - Sources walkthrough: 'package.json' otherwise '.npmignore' otherwise '.gitignore'.
- `yarn`
    - Sources walkthrough: 'package.json' otherwise '.yarnignore' otherwise '.npmignore' otherwise '.gitignore'.
- `vsce`
    - Check: `vsce ls`
    - Sources walkthrough: '.vscodeignore' otherwise '.gitignore'.
