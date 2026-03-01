import type { Dirent, PathLike } from "node:fs"

import type { FsAdapter } from "./types.js"

export async function opendir(
	fs: FsAdapter,
	path: PathLike,
	cb: (entry: Dirent, from: string) => Promise<0 | 1 | 2>,
): Promise<void | 2> {
	const dir = await fs.promises.opendir(path)
	const tasks: Promise<void | 2>[] = []

	for await (const entry of dir) {
		const from = path + "/" + entry.name

		const task = (async (): Promise<void | 2> => {
			const r = await cb(entry, from)
			if (r === 2) return 2
			if (r === 1) return

			if (entry.isDirectory()) {
				return await opendir(fs, from, cb)
			}
		})()

		tasks.push(task)
	}

	const results = await Promise.all(tasks)

	if (results.includes(2)) {
		return 2
	}
}
