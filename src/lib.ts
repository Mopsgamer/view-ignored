import path from "path";
import FastGlob from "fast-glob";
import { readFileSync } from "fs";
import ignore, { Ignore } from "ignore";
import { execSync } from "child_process";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { patternsExclude, lookGit, lookProperty } from "./presets.js";

//#region Looker
export interface LookerOptions extends ignore.Options {
	/**
	 * @see {@link Looker.isNegated}
	 */
	negated?: boolean
}
export type LookerPattern = string | readonly string[]
export class Looker {
	/**
	 * If `true`, when calling {@link Looker.ignores}, method will return `true` for ignored path.
	 */
	public isNegated: boolean
	private ignoreInstance: Ignore

	constructor(options?: LookerOptions) {
		this.isNegated = options?.negated ?? false
		this.ignoreInstance = ignore.default(options)
	}

	negate(): this {
		this.isNegated = !this.isNegated
		return this
	}

	/**
	 * Adds new ignore rule.
	 * @param pattern .gitignore file specification pattern.
	 */
	add(pattern: LookerPattern): this {
		this.ignoreInstance.add(pattern)
		return this
	}

	/**
	 * Checks if the Looker should ignore dir entry path.
	 * @see {@link Looker.isNegated} can change the return value.
	 * @param path Dir entry path.
	 */
	ignores(path: string): boolean {
		const ignores = this.ignoreInstance.ignores(path)
		return this.isNegated ? !ignores : ignores;
	}

	/**
	 * Checks if given pattern is valid.
	 * @param pattern Dir entry path.
	 */
	isValidPattern(pattern: LookerPattern) {
		if (typeof pattern === "string") {
			return ignore.default.isPathValid(pattern)
		}
		return pattern.every(p => ignore.default.isPathValid(p))
	}
}
//#endregion

//#region path methods
/**
 * Get file paths using pattern.
 * @param pattern The pattern.
 * @param cwd Current working directory.
 * @param ignore Ignore patterns.
 */
export function globFiles(pattern: string | string[], cwd: string, ignore?: string[]): string[] {
	return FastGlob.sync(pattern, { cwd, ignore, onlyFiles: true, dot: true })
}

/**
 * Returns closest dir entry path for another one using the given list.
 * If `undefined`, no reliable sources that contain patterns to ignore.
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
/**
 * Read git config value as string.
 */
export function gitConfigString(key: string, cwd?: string): string | undefined {
	try {
		return execSync(`git config ${key}`, { cwd: cwd, }).toString();
	} catch (error) {
		return;
	}
}
/**
 * Read git config value as boolean.
 */
export function gitConfigBool(key: string, cwd?: string): boolean | undefined {
	const str = gitConfigString(key, cwd)
	if (str === "true\n") {
		return true
	}
	if (str === "false\n") {
		return false
	}
}
//#endregion

//#region looking
/**
 * @see {@link LookMethod}
 */
export interface LookMethodData {
	looker: Looker,
	filePath: string,
	source: string,
	sourceContent: string,
}
/**
 * Returns `true` if given source is valid, writes rules to the looker.
 */
export type LookMethod = (data: LookMethodData) => boolean

export interface LookFileOptions {
	/**
	 * Current working directory.
	 * Recommended to set this value yourself.
	 * 
	 * @default process.cwd()
	 */
	cwd?: string,
	/**
	 * Additional patterns, which will be used as
	 * other patterns in the `.gitignore` file, or `package.json` "files" property.
	 */
	addPattern?: string[],
	/**
	 * Force exclude patterns from file path list.
	 * 
	 * @see {@link patternsExclude} can be used.
	 */
	hidePattern?: string[],
	/**
	 * Sources like `.gitignore` or `package.json` "files" property. It breaks on first valid source.
	 * @example [["**\/.gitignore", lookGit()]]
	 * @see {@link lookGit}, {@link lookProperty}
	 * @see {@link lookGit}, {@link lookProperty}
	 */
	sources: [string | string[], LookMethod][],
	allowRelativePaths?: boolean
}

/**
 * Result of the file path scan.
 */
export class LookFileResult {
	constructor(
		public ignored: boolean,
		public filePath: string,
		public source: string,
	) { }
	toString(): string {
		return `${this.filePath}`
	}
}

/**
 * Returns `undefined`, if any source is bad.
 */
export function lookFilePath(filePath: string, sourcePath: string, method: LookMethod, options: Omit<LookFileOptions, "sources" | "hidePattern">): Looker | undefined {
	const {
		cwd = process.cwd(),
		addPattern = [],
		allowRelativePaths = true,
	} = options

	const ignoreCase = gitConfigBool('core.ignoreCase') ?? false

	const looker = new Looker({
		allowRelativePaths: allowRelativePaths,
		ignoreCase: ignoreCase,
	})

	const sourceContent = readFileSync(path.join(cwd, sourcePath)).toString()
	const isGoodSource = method({
		source: sourcePath,
		sourceContent: sourceContent,
		filePath: filePath,
		looker: looker
	})
	if (isGoodSource) {
		looker.add(addPattern)
		return looker
	}
}

/**
 * Returns `undefined`, if any source is bad.
 */
export function lookFilePathTry(filePath: string, options: LookFileOptions): Looker | undefined {
	const {
		cwd = process.cwd(),
		hidePattern = [],
		sources,
	} = options

	for (const [pattern, method] of sources) {
		const possibleSourcePaths = globFiles(pattern, cwd)
		const sourcePath = closestFilePath(filePath, possibleSourcePaths)
		if (sourcePath === undefined) {
			continue
		}
		return lookFilePath(filePath, sourcePath, method, options)
	}
}

export const filterNameList = ["ignored", "included", "all"] as const
export type FilterName = typeof filterNameList[number]
interface LookFolderOptions extends LookFileOptions {
	/**
	* Specifies the maximum depth of a read directory relative to the start
	* directory.
	*
	* @default Infinity
	*/
	deep?: FastGlob.Options["deep"]
	/**
	 * Mark the directory path with the final slash.
	 *
	 * @default false
	 */
	markDirectories?: FastGlob.Options["markDirectories"]
	filter?: FilterName
}

/**
 * Scan project directory with results for each file path.
 */
export function lookProjectDirSync(options: LookFolderOptions): LookFileResult[] {
	const { sources, cwd = process.cwd(), hidePattern = [], filter = "included", deep, markDirectories } = options;
	const cache = new Map<string, Looker>()
	const resultList: LookFileResult[] = []
	const allPaths = FastGlob.sync(
		"**",
		{
			cwd: options.cwd,
			dot: true,
			ignore: hidePattern,
			onlyFiles: true,
			deep,
			markDirectories,
		}
	)
	FindGoodSource: for (const [pattern, method] of sources) {
		const matches = globFiles(pattern, cwd)
		let goodFound = false
		for (const filePath of allPaths) {
			const sourcePath = closestFilePath(filePath, matches)
			if (sourcePath === undefined) {
				break
			}
			let looker = cache.get(sourcePath)
			if (looker === undefined) {
				looker = lookFilePath(filePath, sourcePath, method, options)
				if (looker === undefined) {
					break
				}
				cache.set(sourcePath, looker)
			}
			const isIgnored = looker.ignores(filePath)
			const filterIgnore = (filter === "ignored") && isIgnored
			const filterInclude = (filter === "included") && !isIgnored
			const filterAll = filter === "all"
			if (filterIgnore || filterInclude || filterAll) {
				const lookResult = new LookFileResult(isIgnored, filePath, sourcePath)
				resultList.push(lookResult)
			}
			goodFound = true
		}
		if (goodFound) {
			break
		}
	}
	return resultList
}
//#endregion
