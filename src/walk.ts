import * as fsp from 'node:fs/promises'
import type { Dirent, PathLike } from 'node:fs'

export async function opendir(path: PathLike, cb: (entry: Dirent) => Promise<0 | 1 | 2>): Promise<void | 2> {
  const dir = await fsp.opendir(path)
  for await (const entry of dir) {
    const r = await cb(entry)
    if (r === 2) {
      return 2
    }
    if (r === 1) {
      continue
    }
    if (entry.isDirectory()) {
      const r = await opendir(path + '/' + entry.name, cb)
      if (r === 2) {
        return 2
      }
    }
  }
}
