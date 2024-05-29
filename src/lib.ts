import path from "path";
import FastGlob from "fast-glob";
import { readFileSync } from "fs";
import ignore, { Ignore } from "ignore";
import { execSync } from "child_process";

//#region Looker
export interface LookerOptions extends ignore.Options {
	negated?: boolean
}
export type LookerPattern = string | readonly string[]
export class Looker {
	public negated: boolean
	private ignoreInstance: Ignore

	constructor(options?: LookerOptions) {
		this.negated = options?.negated ?? false
		this.ignoreInstance = ignore.default(options)
	}

	negate(): this {
		this.negated = !this.negated
		return this
	}

	add(pattern: LookerPattern): void {
		this.ignoreInstance.add(pattern)
	}

	ignores(path: LookerPattern): boolean {
		const normalPath = typeof path === "string" ? path : path.join("\n");
		const ignores = this.ignoreInstance.ignores(normalPath)
		return this.negated ? !ignores : ignores;
	}

	isValidPattern(pattern: string) {
		return ignore.default.isPathValid(pattern)
	}
}
//#endregion

//#region path methods
export function findFiles(pattern: string | string[], cwd: string, ignore: string[]): string[] {
	const paths: string[] = FastGlob.sync(pattern, { cwd, ignore, onlyFiles: true, dot: true })
	return paths
}

/**
 * If `undefined` - No reliable sources that contain patterns to ignore.
 */
export function closestFilePath(filePath: string, paths: string[]): string | undefined {
	const filePathDir = path.dirname(filePath)
	const result = paths.reverse().find(p => {
		const pd = path.dirname(p)
		const result = filePathDir.startsWith(pd) || pd === '.'
		return result
	})
	return result
}
//#endregion

//#region git config reading
export function gitConfigString(prop: string, cwd?: string): string | undefined {
	try {
		return execSync(`git config ${prop}`, { cwd: cwd, }).toString();
	} catch (error) {
		return;
	}
}
export function gitConfigBool(prop: string, cwd?: string): boolean | undefined {
	const str = gitConfigString(prop, cwd)
	if (str === "true\n") {
		return true
	}
	if (str === "false\n") {
		return false
	}
}
//#endregion

//#region looking
export interface LookMethodData {
	looker: Looker,
	target: string,
	source: string,
	sourceContent: string,
}
export type LookMethod = (data: LookMethodData) => boolean

export interface LookFileOptions {
	cwd?: string,
	addPattern?: string[],
	hidePattern?: string[],
	sources: [string | string[], LookMethod][],
	allowRelativePaths?: boolean
}

export interface LookFileResult {
	target: string
	source: string
	toString(withSource?: boolean): string
}

/**
 * Undefined if any source is bad.
 */
export function lookFile(filePath: string, options: LookFileOptions): Looker | undefined {
	const {
		cwd = process.cwd(),
		hidePattern = [],
		addPattern = [],
		sources,
		allowRelativePaths = true,
	} = options

	const ignoreCase = gitConfigBool('core.ignoreCase') ?? false

	const looker = new Looker({
		allowRelativePaths: allowRelativePaths,
		ignoreCase: ignoreCase,
	})

	for (const [pattern, method] of sources) {
		const possibleSourcePaths = findFiles(pattern, cwd, hidePattern)
		const sourcePath = closestFilePath(filePath, possibleSourcePaths)
		if (sourcePath === undefined) {
			continue
		}
		const sourceContent = readFileSync(path.join(cwd, sourcePath)).toString()
		const isGoodSource = method({
			source: sourcePath,
			sourceContent: sourceContent,
			target: filePath,
			looker: looker
		})
		if (isGoodSource) {
			looker.add(addPattern)
			return looker
		}
	}
}

export const filterNameList = ["ignored", "included", "all"] as const
export type FilterName = typeof filterNameList[number]
interface LookFolderOptions extends LookFileOptions {
	filter?: FilterName
}

/**
 * If `false` - should break.
 */
function processPath(somePath: string, matches: string[], resultList: LookFileResult[], options: LookFileOptions, cache: Map<string, Looker>, cwd: string, ignore: string[], filter: FilterName): boolean {
	const sourcePath = closestFilePath(somePath, matches)
	if (sourcePath === undefined) {
		return false
	}
	let looker = cache.get(sourcePath)
	if (looker === undefined) {
		looker = lookFile(somePath, options)
		if (looker === undefined) {
			return false
		}
		cache.set(sourcePath, looker)
	}
	const isIgnored = looker.ignores(somePath)
	const filterIgnore = (filter === "ignored") && isIgnored
	const filterInclude = (filter === "included") && !isIgnored
	const filterAll = filter === "all"
	if (filterIgnore || filterInclude || filterAll) {
		resultList.push({
			target: somePath,
			source: sourcePath,
			toString(withSource) {
				let r = `${this.target}`
				if (withSource) {
					r = `${r} : ${this.source}`
				}
				return r
			},
		} satisfies LookFileResult)
	}
	return true
}

export function lookProjectSync(options: LookFolderOptions): LookFileResult[] {
	const { sources, cwd = process.cwd(), hidePattern = [], filter = "included" } = options;
	// caching Ignore instances so as not to parse everything again.
	const cache = new Map<string, Looker>()
	const resultList: LookFileResult[] = []
	const allPaths = FastGlob.sync(
		"**",
		{
			cwd: options.cwd,
			dot: true,
			ignore: hidePattern,
			onlyFiles: true
		}
	)
	for (const [pattern] of sources) {
		const matches = findFiles(pattern, cwd, hidePattern)
		let isGoodSource = false
		for (const somePath of allPaths) {
			isGoodSource = processPath(somePath, matches, resultList, options, cache, cwd, hidePattern, filter)
		}
		if (isGoodSource) {
			break
		}
	}
	return resultList
}

//#endregion
