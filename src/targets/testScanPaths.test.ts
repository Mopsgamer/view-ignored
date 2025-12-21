import { deepEqual } from "node:assert/strict";
import { createFsFromVolume, Volume, type NestedDirectoryJSON } from "memfs";
import { cwd } from "node:process";
import { scan, type ScanOptions } from "../scan.js";
import type { FsPromises } from "../fsp.js";
import type { MatcherContext } from "../patterns/matcher.js";

export const memcwd = cwd().replace(/\w:/, "").replaceAll("\\", "/");

export type PathHandler =
  | ((o: {
      vol: Volume;
      fsp: FsPromises;
      ctx: MatcherContext;
      options: ScanOptions;
    }) => void | Promise<void>)
  | string[];

/**
 * Executes tests within './test'.
 */
export async function testScanPaths(
  tree: NestedDirectoryJSON,
  test: PathHandler,
  options: ScanOptions,
): Promise<void> {
  const vol = new Volume();
  const cwd = memcwd + "/test";
  vol.fromNestedJSON(tree, cwd);
  const fs = createFsFromVolume(vol);
  const { opendir, readFile } = fs.promises;
  const fsp = { opendir, readFile } as FsPromises;
  const o = { cwd: cwd, fsp, ...options };
  const ctx = await scan(o);
  const { paths: set } = ctx;
  const paths = [...set];

  if (typeof test === "function") await test({ vol, fsp, ctx, options: o });
  else deepEqual(paths, test);
}
