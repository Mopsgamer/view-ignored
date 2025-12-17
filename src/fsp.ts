import type * as fs from "node:fs";

export interface FsPromises {
  opendir: typeof fs.promises.opendir;
  readFile: typeof fs.promises.readFile;
}
