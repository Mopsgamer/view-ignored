import { resolve } from "node:path"

export function normalizeCwd(cwd: string): string {
	return resolve(cwd).replaceAll("\\", "/").replace(/\w:/, "")
}
