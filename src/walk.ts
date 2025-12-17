import type { Dirent, PathLike } from "node:fs";
import type { FsPromises } from "./fsp.js";

export async function opendir(
  fsp: FsPromises,
  path: PathLike,
  cb: (entry: Dirent) => Promise<0 | 1 | 2>,
): Promise<void | 2> {
  const dir = await fsp.opendir(path);
  for await (const entry of dir) {
    const r = await cb(entry);
    if (r === 2) {
      return 2;
    }
    if (r === 1) {
      continue;
    }
    if (entry.isDirectory()) {
      const r = await opendir(fsp, path + "/" + entry.name, cb);
      if (r === 2) {
        return 2;
      }
    }
  }
}
