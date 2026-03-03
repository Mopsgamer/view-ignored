import type { Dirent } from "node:fs"

import type { FsAdapter } from "./types.js"

export async function opendir(
	fs: FsAdapter,
	normalCwd: string,
	place: string,
	cb: (dirent: Dirent, parentPath: string, path: string) => Promise<0 | 1 | 2>,
): Promise<void | 2> {
	const dir = await fs.promises.opendir(place)
	const tasks: Promise<void | 2>[] = []

	const normalParentPath = place
	const substr = normalParentPath.substring(normalCwd.length + 1)
	let parentPath: string
	if (normalParentPath.length === normalCwd.length) {
		parentPath = "."
	} else {
		parentPath = substr
	}
	for await (const entry of dir) {
		const from = place + "/" + entry.name

		let path: string

		if (normalParentPath.length === normalCwd.length) {
			path = entry.name
		} else {
			path = substr + "/" + entry.name
		}

		const task = (async (): Promise<void | 2> => {
			const r = await cb(entry, parentPath, path)
			if (r === 2) return 2
			if (r === 1) return

			if (entry.isDirectory()) {
				return await opendir(fs, normalCwd, from, cb)
			}
		})()

		tasks.push(task)
	}

	const results = await Promise.all(tasks)

	if (results.includes(2)) {
		return 2
	}
}
