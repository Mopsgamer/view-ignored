import type { Dirent } from "node:fs"

import type { PatternFinderOptions } from "./patterns/extractor.js"

import { resolveSources } from "./patterns/resolveSources.js"

export function opendir(
	options: PatternFinderOptions,
	place: string,
	cb: (dirent: Dirent, parentPath: string, path: string, next: (r: 0 | 1 | 2) => void) => void,
	onDone: (stop: boolean) => void,
): void {
	const { ctx, cwd, fs, signal, target } = options

	fs.promises
		.opendir(place)
		.then((dir) => {
			const normalParentPath = place
			const substr = normalParentPath.substring(cwd.length + 1)
			const isRootDir = normalParentPath.length === cwd.length
			const parentPath = isRootDir ? "." : substr

			resolveSources({ ctx, cwd, fs, signal, target, dir: parentPath })
				.then(() => {
					if (signal?.aborted) {
						onDone(false)
						return
					}
					let stop = false
					let pending = 0
					let closed = false

					function checkDone() {
						if (closed && pending === 0) {
							onDone(stop)
						}
					}

					function iterate() {
						if (stop || signal?.aborted) {
							closed = true
							checkDone()
							return
						}
						dir
							.read()
							.then((entry) => {
								if (entry === null || stop || signal?.aborted) {
									closed = true
									checkDone()
									return
								}

								const from = place + "/" + entry.name
								const path = isRootDir ? entry.name : substr + "/" + entry.name

								iterate()

								pending++
								cb(entry, parentPath, path, (r) => {
									if (r === 1) {
										pending--
										checkDone()
									} else if (r === 2) {
										stop = true
										pending--
										checkDone()
									} else if (entry.isDirectory()) {
										opendir(options, from, cb, (dirStop) => {
											if (dirStop) stop = true
											pending--
											checkDone()
										})
									} else {
										pending--
										checkDone()
									}
								})
							})
							.catch(() => {
								closed = true
								checkDone()
							})
					}

					iterate()
				})
				.catch(() => {
					onDone(false)
				})
		})
		.catch(() => {
			onDone(false)
		})
}
