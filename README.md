# view-ignored

Get a list of ignored files by targets: git, npm, yaml, docker, ... .

## Features

- View a list of ignored and included files.
- Sorting a list.

### Targets

- Git (.gitignore, git config get `core.excludesFile`)
- NPM (package.json, .npmignore, .gitignore)
- Yarn (package.json, .yarnignore, .npmignore, .gitignore)
- VSC Extension (.vscodeignore, .gitignore)

Planned:

- PNPM

###

## Planned

## Install

```bash
npm i ...
```

> Don't forget to configure the keywords and files in 'package.json', reinitialize the package using 'npm init', and specify the paths in 'tsconfig.json' and 'eslint.config.mjs'.