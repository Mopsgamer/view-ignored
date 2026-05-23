import { createFsFromVolume, Volume } from "memfs"

import type { FsAdapter } from "./types.js"

export const elfJS = 'module.exports = elf => console.log("i\'m a elf")'
export const bin = "echo hi"

export function createAdapter(vol: Volume): FsAdapter {
	const fs = createFsFromVolume(vol)
	const adapter: FsAdapter = {
		lstat: fs.lstat.bind(fs) as any,
		readFile: fs.readFile.bind(fs) as any,
		readlink: fs.readlink.bind(fs) as any,
		readdir: fs.readdir.bind(fs) as any,
		stat: fs.stat.bind(fs) as any,
	}
	return adapter
}

export function populateVolume(vol: Volume, tree: any, base: string = "/test") {
	for (const [key, value] of Object.entries(tree)) {
		const p = base + "/" + key
		if (typeof value === "string") {
			vol.mkdirSync(base, { recursive: true })
			vol.writeFileSync(p, value)
		} else if (typeof value === "object" && value !== null) {
			if ((value as any).isSymlink) {
				vol.mkdirSync(base, { recursive: true })
				vol.symlinkSync((value as any).path, p)
			} else {
				vol.mkdirSync(p, { recursive: true })
				populateVolume(vol, value, p)
			}
		}
	}
}
