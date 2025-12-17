import { deepEqual } from "node:assert/strict";
import { createFsFromVolume, Volume, type NestedDirectoryJSON } from "memfs";
import { cwd } from "node:process";
import { scan, type ScanOptions } from "../scan.js";
import type { FsPromises } from "../fsp.js";

export const memcwd = cwd().replace(/\w:/, "");

export type PathHandler =
  | ((o: { paths: string[]; vol: Volume; fsp: FsPromises }) => void | Promise<void>)
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
  vol.fromNestedJSON(tree, memcwd + "/test");
  const fs = createFsFromVolume(vol);
  const { opendir, readFile } = fs.promises;
  const fsp = { opendir, readFile } as FsPromises;
  const { paths: set } = await scan({ cwd: memcwd + "/test", fsp, ...options });
  const paths = [...set];

  if (typeof test === "function") await test({ paths, vol, fsp });
  else deepEqual(paths, test);
}
