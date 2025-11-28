# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to
[Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

- Update dependencies.

## [0.4.6] - 2025-08-11

- Fixed incorrect interface implementation for `stream.run()`.
This fix changes return type for this method
from `void` to `Promise<DeepStreamDataRoot>`.
Command-line now awaits this method, which
fixes `--parsable` and some other related crashes.

## [0.4.5] - 2025-08-03

- Remove extra new line for cli output.
- Improve performance: faster `isMatch`.
- Fix directory edge case: `scripts` now matches `scripts/run.ts`.
- Fix jsonc and manifest validation for jsr. Add test.

## [0.4.4] - 2025-07-09

- Update README.
- Fix boolean cli options.
- Use ora instead of listr2.

## [0.4.3] - 2025-07-07

- Fix negative matching.

## [0.4.2] - 2025-07-03

- Add jsr target.

## [0.4.1] - 2025-07-02

- Update dependencies.
- Do not export internal API.
- Emit to `out`, not `out/src`: package.json not duplicated. Add visible type
  exports.
- Move to `node --test` from `mocha`.
- Move to `eslint` from `xo`.
- Move to Bun from PNPM.

## [0.4.0] - 2025-06-18

- Update dependencies.
- Lint.
- Changed `TargetIcon` type.
- Fixed `ScannerMinimatch.pattern` recursion.

## [0.3.2] - 2024-10-11

- Fix `Cannot find module '../../package.json'`.

## [0.3.1] - 2024-10-11

- Update dependencies.
- Git line endings: lf.

## [0.3.0] - 2024-10-10

- Code linting: move from eslint to xo.
- Changed cli output.
- API Changes.
- Changes for configuration properties. Removed color property (color level).

## [0.2.2] - 2024-08-20

- Fix the cli.

## [0.2.1] - 2024-08-12

- Fix hierarchy loop exit first iteration.
- Fix main field (package.json).

## [0.2.0] - 2024-08-10

- Refactor, add more stuff: changes for the command-line and API.
- Change project structure: move 'lib' -> 'out/src'
- Implement command-line `--plugins`, `--depth` and `--show-sources` options.

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
- Cli throught `viewig` and `view-ignored` - command-line client with config and
  scan commands.
- Plugin system - unsupported cli, bad binding api (public Map variable and
  functions).
