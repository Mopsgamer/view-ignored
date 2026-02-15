# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to
[Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

- Add Deno target
- Remove the "deno.json(c)" extractor JSR.

## [0.8.0] - 2026-02-14

- Add more patterns for NPM (npm-packlist, main),
  VSCE (vscode-vsce, main), Yarn (berry, main).
- Add `YarnClassic` (yarn, main).
- Add `nocase` option.
- Add `stringCompile(string, context, {nocase})`.
- Add `Target.init?(InitState)`.
- Add `MatcherStream.start()`.
- Fix secondary "dirent" emit for directories (overriding event).
- Improve performance by 60 percent by reimplementing internal path conversions.

## [0.7.1] - 2026-02-11

- Add `signal` option for `Target.ignores` and `resolveSources`.

## [0.7.0] - 2026-02-11

- Ignore for "missing-source".
- Change "since" from `0.0.6` to `0.6.0`.
- Provide source value for "no-match", "broken-source", "invalid-pattern".
- Provide pattern and error values for "invalid-internal-pattern".

## [0.6.0] - 2026-02-10

- Replaces the 0.5.x release, which was untested and non functional.
- Introduces improved APIs building on 0.5.x, including new scanning options
  such as `within`, `fastInternal`, `fs`, and more.
- Node 18 support.

## [0.5.2] - 2025-12-15

- Disallow negative depth values.
- Use the `AbortSignal.throwIfAborted` method.
- Fix potentially broken `package.json` `files` pattern processing.
- Add `sourcePushNegatable` helper function.

## [0.5.1] - 2025-12-15

- Improve README targets section and jsdoc comments.
- Fix misleading docs.

## [0.5.0] - 2025-15-12

- BREAKING CHANGE: Rewrote the project.
- BREAKING CHANGE: The command-line tool has been removed, with no plans to add it back.
- Compiled using `@typescript/native-preview`.
- Updated dependencies and the manifest.

## [0.4.8] - 2025-12-08

- Fix maxDepth counting.
- Fix cli progress reporting.
- CWD is not reported anymore.
- Update yaml from 2.8.1 to 2.8.2.

## [0.4.7] - 2025-11-29

- Update dependencies.
- Implement concurrency correctly.
- Refactor.

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
