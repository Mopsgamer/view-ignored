import path from "path";
import FastGlob from "fast-glob";
import {readFileSync} from "fs";
import ignore, {Ignore} from "ignore";
import {execSync} from "child_process";

//#region path methods
export function findFiles(pattern: (string | string[])[], cwd: string): string[] {
	let i = 0
	let paths: string[]
	do {
		paths = FastGlob.sync(pattern[i], {cwd: cwd, onlyFiles: true, dot: true})
		i++
	} while (paths.length === 0)
	return paths
}

export function closestFilePath(filePath: string, paths: string[]): string {
	const filePathDir = path.dirname(filePath)
	const result = paths.reverse().find(p => {
		const pd = path.dirname(p)
		const result = filePathDir.startsWith(pd) || pd === '.'
		return result
	})
	if (!result) {
		throw new Error(`Ignore file not found for '${filePath}' with paths: '${paths.join("', '")}'`)
	}
	return result
}
//#endregion

//#region looking methods
interface LookMethodData {
	instance: Ignore,
	filePath: string,
	ignPath: string,
	ignContent: string,
}
export type LookMethod = (data: LookMethodData) => [Ignore, boolean]

export interface LookFileOptions {
	cwd?: string,
	ignore?: string[],
	method: LookMethod,
	pattern: (string | string[])[],
	allowRelativePaths?: boolean
}

export function gitConfigString(prop: string, cwd?: string): string {
	try {
		return execSync(`git config ${prop}`, {cwd: cwd, }).toString();
	} catch (error) {
		return String(error)
	}
}
export function gitConfigBool(prop: string, cwd?: string): boolean {
	return gitConfigString(prop, cwd) === "true\n";
}

export function lookFile(filePath: string, options: LookFileOptions): [Ignore, boolean] {
	const {
		cwd = process.cwd(),
		ignore: include = "",
		method,
		pattern,
		allowRelativePaths,
	} = options

	const matches = findFiles(pattern, cwd)
	const closestIgnFilePath = closestFilePath(filePath, matches)
	const closestIgnContent = readFileSync(path.join(cwd, closestIgnFilePath)).toString()
	const instance = ignore.default({
		allowRelativePaths: allowRelativePaths ?? true,
		ignoreCase: gitConfigBool('core.ignoreCase'),
		ignorecase: gitConfigBool('core.ignorecase'),
	})
	if (include) {
		try {
			instance.add(include)
		} catch (error) {
			throw new Error(`Invalid include pattern '${include}'. Do you use current dir prefix './path' ?`)
		}
	}
	const [instanceModified, negated] = method({ignPath: closestIgnFilePath, ignContent: closestIgnContent, filePath: filePath, instance: instance})
	return [instanceModified, negated]
}

export const viewList = ["ignored", "included", "all"] as const
export type View = typeof viewList[number]
interface LookFolderOptions extends LookFileOptions {
	view?: View
}

export const defaultIgnore: string[] = [
	"!.git",
	"!node_modules",
	"!.DS_Store"
]

export function lookProjectSync(options: LookFolderOptions): string[] {
	const view = options.view ?? "included"
	// caching Ignore instances so as not to parse everything again.
	const cache = new Map<string, [Ignore, boolean]>()
	const resultPaths: string[] = []
	const allPaths = FastGlob.sync(["**", ...defaultIgnore], {cwd: options.cwd, dot: true, ignore: options.ignore, onlyFiles: true})
	for (const somePath of allPaths) {
		const matches = findFiles(options.pattern, options.cwd ?? process.cwd())
		const ignPath = closestFilePath(somePath, matches)
		let cign = cache.get(ignPath)
		if (!cign) {
			cache.set(ignPath, cign = lookFile(somePath, options))
		}
		const [instance, negated] = cign
		const isIgnored = instance.test(somePath)[negated ? "unignored" : "ignored"]
		const filterIgnore = (view === "ignored") && isIgnored
		const filterInclude = (view === "included") && !isIgnored
		const filterAll = view === "all"
		if (filterIgnore || filterInclude || filterAll) {
			resultPaths.push(somePath)
		}
	}
	return resultPaths
}
//#endregion
