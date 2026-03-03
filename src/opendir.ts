import type { Dirent } from "node:fs"

import type { PatternFinderOptions } from "./patterns/extractor.js"

import { resolveSources } from "./patterns/resolveSources.js"

export async function opendir(
	options: PatternFinderOptions,
	place: string,
	cb: (dirent: Dirent, parentPath: string, path: string) => Promise<0 | 1 | 2>,
): Promise<boolean> {
	const { ctx, cwd, fs, signal, target } = options

	const dir = await fs.promises.opendir(place)
	const tasks: Promise<void>[] = []

	const normalParentPath = place
	const substr = normalParentPath.substring(cwd.length + 1)
	let parentPath: string
	if (normalParentPath.length === cwd.length) {
		parentPath = "."
	} else {
		parentPath = substr
	}

	await resolveSources({ ctx, cwd, fs, signal, target, dir: parentPath })

	let stop = false
	for await (const entry of dir) {
		const from = place + "/" + entry.name

		let path: string

		if (normalParentPath.length === cwd.length) {
			path = entry.name
		} else {
			path = substr + "/" + entry.name
		}

		const task = (async (): Promise<void> => {
			const r = await cb(entry, parentPath, path)
			if (r === 1) return

			if (r === 2 || (entry.isDirectory() && (await opendir(options, from, cb)))) {
				stop = true
				return
			}
		})()

		tasks.push(task)
	}

	await Promise.all(tasks)
	return stop
}
