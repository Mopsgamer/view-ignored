import { resolve } from "node:path"

/**
 * @since 0.8.1
 */
export function unixify(cwd: string): string {
	return resolve(cwd).replaceAll("\\", "/").replace(/\w:/, "")
}
