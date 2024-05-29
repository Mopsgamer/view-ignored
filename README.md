# view-ignored

[![npm version](https://badge.fury.io/js/view-ignored.svg)](https://www.npmjs.com/package/view-ignored)

Get a list of ignored files by targets: git, npm, yarn, docker, ... .

## Install

```bash
npm i view-ignored
```

## Highlights

- Output sorting.
- Output styling: paths, tree, treeEmoji, treeNerd (using [nerd fonts](https://github.com/ryanoasis/nerd-fonts)).
- No colors option: `--color 0`.
- Visible current working directory.


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
- `vscodeExtension`
    - Check: `vsce ls`
    - Sources walkthrough: '.vscodeignore', '.gitignore'.

Planned:

- `docker`
    - Sources walkthrough: '.dockerignore', '.gitignore'?
- `esbuild`
    - Sources walkthrough: ?
- `webpack`
    - Sources walkthrough: ?