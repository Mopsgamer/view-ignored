import { createFsFromVolume, Volume } from "memfs"
import type { FsAdapter } from "./types.js"

export function createAdapter(vol: Volume): FsAdapter {
	const fs = createFsFromVolume(vol)
	const adapter = {
		readFile: fs.readFile.bind(fs),
		readdir: fs.readdir.bind(fs),
		stat: fs.stat.bind(fs),
		lstat: fs.lstat.bind(fs),
		readlink: fs.readlink.bind(fs),
	} as unknown as FsAdapter
	return adapter
}
