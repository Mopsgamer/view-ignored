import { scan } from "./scan.js";
import { test } from "node:test";
import { deepEqual } from "node:assert/strict";
import { Git as target } from "./targets/git.js";
import { sortFirstFolders } from "./scan_sort.test.js";

void test("scan Git (self, flat)", async () => {
  const r = await scan({ target, depth: 0, fastDepth: true });
  deepEqual(
    sortFirstFolders(r.paths),
    sortFirstFolders([
      ".gitattributes",
      ".github/",
      ".gitignore",
      ".oxlintrc.json",
      ".release-it.json",
      ".vscode/",
      "CHANGELOG.md",
      "LICENSE.txt",
      "README.md",
      "bun.lock",
      "package.json",
      "src/",
      "tsconfig.json",
      "tsconfig.prod.json",
    ]),
  );
});

void test("scan Git (self)", async () => {
  const r = await scan({ target });
  // this test uses sortFirstFolders implementation
  // provided by https://jsr.io/@m234/path/0.1.4/sort-cmp.ts
  // you can install this jsr package in your project
  // for sorting - new Set(sorted) keeps sorting :),
  // but your package and dependents should also declare
  // @jsr:registry=https://npm.jsr.io in .npmrc or something.
  deepEqual(
    sortFirstFolders(r.paths).filter((path) => !path.endsWith("/")),
    sortFirstFolders([
      ".gitattributes",
      ".github/workflows/release.yml",
      ".gitignore",
      ".oxlintrc.json",
      ".release-it.json",
      ".vscode/extensions.json",
      ".vscode/launch.json",
      ".vscode/settings.json",
      ".vscode/tasks.json",
      "CHANGELOG.md",
      "LICENSE.txt",
      "README.md",
      "bun.lock",
      "package.json",
      "src/fsp.ts",
      "src/index.ts",
      "src/patterns/gitignore.test.ts",
      "src/patterns/gitignore.ts",
      "src/patterns/index.ts",
      "src/patterns/jsrjson.ts",
      "src/patterns/matcher.ts",
      "src/patterns/packagejson.ts",
      "src/scan.ts",
      "src/scan_invalid_depth.test.ts",
      "src/scan_self_git.test.ts",
      "src/scan_self_npm.test.ts",
      "src/scan_sort.test.ts",
      "src/targets/git.test.ts",
      "src/targets/git.ts",
      "src/targets/index.ts",
      "src/targets/jsr.ts",
      "src/targets/npm.test.ts",
      "src/targets/npm.ts",
      "src/targets/target.ts",
      "src/targets/testScanPaths.test.ts",
      "src/targets/vsce.ts",
      "src/targets/yarn.ts",
      "src/edit.test.ts",
      "src/edit.ts",
      "src/walk.ts",
      "tsconfig.json",
      "tsconfig.prod.json",
    ]),
  );
});
