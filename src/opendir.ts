import type { Dirent } from "node:fs"

import type { FsAdapter } from "./types.js"

export async function opendir(
	fs: FsAdapter,
	normalCwd: string,
	place: string,
	cb: (dirent: Dirent, parentPath: string, path: string) => Promise<0 | 1 | 2>,
): Promise<boolean> {
	const dir = await fs.promises.opendir(place)
	const tasks: Promise<void>[] = []

	const normalParentPath = place
	const substr = normalParentPath.substring(normalCwd.length + 1)
	let parentPath: string
	if (normalParentPath.length === normalCwd.length) {
		parentPath = "."
	} else {
		parentPath = substr
	}

	let stop = false
	for await (const entry of dir) {
		const from = place + "/" + entry.name

		let path: string

		if (normalParentPath.length === normalCwd.length) {
			path = entry.name
		} else {
			path = substr + "/" + entry.name
		}

		const task = (async (): Promise<void> => {
			const r = await cb(entry, parentPath, path)
			if (r === 1) return

			if (r === 2 || (entry.isDirectory() && (await opendir(fs, normalCwd, from, cb)))) {
				stop = true
				return
			}
		})()

		tasks.push(task)
	}

	await Promise.all(tasks)
	return stop
}
