import type * as fs from "node:fs"

export interface FsAdapter {
	promises: {
		opendir: typeof fs.promises.opendir
		readFile: typeof fs.promises.readFile
	}
}
