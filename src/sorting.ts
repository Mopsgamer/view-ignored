import path from "path"

export const sortNameList = ["firstFolders", "firstFiles", "type", "mixed"] as const
export type SortName = typeof sortNameList[number]

function pathDepth(path: string): number {
	return path.split("/").length
}

export const Sorters: Record<SortName, (a: string, b: string) => number> = {
	firstFolders(a: string, b: string): number {
		return (pathDepth(b) - pathDepth(a)) || Sorters.mixed(a, b)
	},
	firstFiles(a: string, b: string): number {
		return (pathDepth(a) - pathDepth(b)) || Sorters.mixed(a, b)
	},
	type(a: string, b: string): number {
		return path.parse(a).ext.localeCompare(path.parse(b).ext) || Sorters.mixed(a, b)
	},
	mixed(a: string, b: string): number {
		return a.localeCompare(b)
	},
}
