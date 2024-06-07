# view-ignored

[![npm version](https://badge.fury.io/js/view-ignored.svg)](https://www.npmjs.com/package/view-ignored)

Retrieve lists of files ignored by Git, npm, Yarn, Docker, and more with ease.

## Install

```bash
npm i view-ignored
```

## Highlights

- **Multi-target.** Get list of included files, using configuration files. view-ignored provides viewing for multiple [targets](#targets).
- **Use in browser.** view-ignored supports emulated file structures. (It doesn't)
- **Command line.** Supports no-color and multiple output styles, including tree with [nerd fonts](https://github.com/ryanoasis/nerd-fonts).

### Targets

- `git`
    - Check: `git ls-tree -r <branch name: main/master/...> --name-only`
    - Always using git config `core.excludesFile`. Only for this target.
    - Sources walkthrough: '.gitignore'.
- `npm`
    - Check: `npm pack --dry-run`
    - Sources walkthrough: 'package.json', '.npmignore', '.gitignore'.
- `yarn`
    - Sources walkthrough: 'package.json', '.yarnignore', '.npmignore', '.gitignore'.
- `vsce`
    - Check: `vsce ls`
    - Sources walkthrough: '.vscodeignore', '.gitignore'.

Planned:

- `docker`
    - Sources walkthrough: '.dockerignore', '.gitignore'?
- `esbuild`
    - Sources walkthrough: ?
- `webpack`
    - Sources walkthrough: ?