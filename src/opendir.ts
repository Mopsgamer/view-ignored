import type { Dirent } from "node:fs"

import type { FsAdapter } from "./types.js"

/**
 * @internal
 */
export function opendir(
	fs: FsAdapter,
	path: string,
	cb: (err: Error | null, entries: Dirent[]) => void,
): void {
	fs.readdir(path, { withFileTypes: true }, (err, entries) => {
		cb(err, (entries as Dirent[]) || [])
	})
}
