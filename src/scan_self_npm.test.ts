import { scan } from "./scan.js";
import { test } from "node:test";
import { deepEqual, equal } from "node:assert/strict";
import { NPM as target } from "./targets/npm.js";
import { sortFirstFolders } from "./scan_sort.test.js";

void test("scan NPM (self, flat)", async () => {
  const r = await scan({ target, depth: 0, invert: false });
  // this test uses sortFirstFolders implementation
  // provided by https://jsr.io/@m234/path/0.1.4/sort-cmp.ts
  // you can install this jsr package in your project
  // for sorting - new Set(sorted) keeps sorting :),
  // but your package and dependents should also declare
  // @jsr:registry=https://npm.jsr.io in .npmrc or something.
  const paths = sortFirstFolders(r.paths);
  deepEqual(paths, ["out/", "LICENSE.txt", "package.json", "README.md"]);
  equal(r.totalMatchedFiles, 99);
});
