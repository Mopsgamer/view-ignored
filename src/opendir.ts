import type { Dirent, PathLike } from "node:fs"

import type { FsAdapter } from "./types.js"

export async function opendir(
	fs: FsAdapter,
	path: PathLike,
	cb: (entry: Dirent, from: string) => Promise<0 | 1 | 2>,
): Promise<void | 2> {
	const dir = await fs.promises.opendir(path)
	for await (const entry of dir) {
		const from = path + "/" + entry.name
		const r = await cb(entry, from)
		if (r === 2) {
			return 2
		}
		if (r === 1) {
			continue
		}
		if (entry.isDirectory()) {
			const r = await opendir(fs, from, cb)
			if (r === 2) {
				return 2
			}
		}
	}
}
