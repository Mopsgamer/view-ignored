import path from "path"

export const sortNameList = ["firstFolders", "firstFiles", "type", "mixed"] as const
export type SortName = typeof sortNameList[number]

function pathDepth(path: string): number {
	return (path.match(/\//g) || []).length
}

export const Sorters: Record<SortName, (a: string, b: string) => number> = {
	firstFolders(a: string, b: string): number {
		const diff = pathDepth(b) - pathDepth(a)
		return diff || Sorters.mixed(a, b)
	},
	firstFiles(a: string, b: string): number {
		const diff = pathDepth(a) - pathDepth(b)
		return diff || Sorters.mixed(a, b)
	},
	type(a: string, b: string): number {
		return Sorters.mixed(path.parse(a).ext, path.parse(b).ext)
	},
	mixed(a: string, b: string): number {
		return a.localeCompare(b, undefined, {ignorePunctuation: false})
	},
}
