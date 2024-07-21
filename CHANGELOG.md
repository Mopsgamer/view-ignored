# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

- Refactor, add more stuff: changes for the command-line and API.
- Change project structure: move 'lib' -> 'out/src'
- Implement command-line `--plugin` and `--show-sources` options.

## [0.1.1] - 2024-07-14

- Add jsdocs everywhere.
- Add `FileInfo.isIncludedBy`.
- `FileInfo.ignored` is now a getter.

## [0.1.0] - 2024-07-04

- Changed binding api.
- Updated README.

## [0.0.2] - 2024-07-03

- Added 'LICENCE.txt'.
- Added repo links for 'package.json'.

## [0.0.1]

Initial `view-ignored` release.

- API - need more jsdoc comments.
- API for Browser - `fs` and `path` required.
- Cli throught `viewig` and `view-ignored` - command-line client with config and scan commands.
- Plugin system - unsupported cli, bad binding api (public Map variable and functions).
