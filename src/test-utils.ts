/* eslint-disable sort-keys */
import { createFsFromVolume, Volume } from "memfs"

import type { FsAdapter } from "./types.js"

export const elfJS = 'module.exports = elf => console.log("i\'m a elf")'
export const bin = "echo hi"

export type SymlinkFixture = {
	isSymlink: true
	path: string
}

export type TestTree = {
	[key: string]: string | SymlinkFixture | TestTree
}

/**
 * Creates an FsAdapter from a memfs Volume.
 * Since view-ignored internal logic is callback-based,
 * we bind the standard callback methods.
 */
export function createAdapter(vol: Volume): FsAdapter {
	const fs = createFsFromVolume(vol)
	return {
		lstat: fs.lstat.bind(fs) as unknown as FsAdapter["lstat"],
		readFile: fs.readFile.bind(fs) as unknown as FsAdapter["readFile"],
		readdir: fs.readdir.bind(fs) as unknown as FsAdapter["readdir"],
		readlink: fs.readlink.bind(fs) as unknown as FsAdapter["readlink"],
		stat: fs.stat.bind(fs) as unknown as FsAdapter["stat"],
	}
}

/**
 * Robustly populates a memfs Volume from a nested object tree.
 * Supports strings for file content and { isSymlink: true, path: string } for symlinks.
 */
export function populateVolume(vol: Volume, tree: TestTree, base: string = "/test") {
	if (!vol.existsSync(base)) {
		vol.mkdirSync(base, { recursive: true })
	}
	for (const [key, value] of Object.entries(tree)) {
		const p = base + "/" + key
		if (typeof value === "string") {
			const parent = p.substring(0, p.lastIndexOf("/"))
			if (!vol.existsSync(parent)) vol.mkdirSync(parent, { recursive: true })
			vol.writeFileSync(p, value)
		} else if (typeof value === "object" && value !== null) {
			if ("isSymlink" in value && value.isSymlink) {
				const parent = p.substring(0, p.lastIndexOf("/"))
				if (!vol.existsSync(parent)) vol.mkdirSync(parent, { recursive: true })
				vol.symlinkSync((value as SymlinkFixture).path, p)
			} else {
				vol.mkdirSync(p, { recursive: true })
				populateVolume(vol, value as TestTree, p)
			}
		}
	}
}
