import FastGlob from "fast-glob";
import { execSync } from "child_process";
import { LookFolderOptions, lookProject, SourceFile, FileInfo, Source, TargetName } from ".//browser/index.js";
import { getLookMethodGit, getLookMethodPropJSON, npmPatternExclude, npmPatternInclude, patternsExclude } from "./tools/index.js";
import { readFileSync } from "fs";
import { StyleName } from "./tools/styles.js";
import { ChalkInstance } from "chalk";
import path from "path";

//#region git config reading
/**
 * Read git config value as string.
 */
export function gitCurrentBranch(cwd?: string): string | undefined {
	try {
		return execSync(`git rev-parse --abbrev-ref HEAD`, { cwd: cwd, }).toString().trim();
	} catch (error) {
		return;
	}
}
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

//#region method options
export interface ScanFolderOptions extends LookFolderOptions {
	/**
	 * Force exclude patterns from file path list.
	 * 
	 * @see {@link patternsExclude} can be used.
	 */
	ignore?: string[],
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
}
//#endregion


//#region methods
export function scanProject(dirPath: string, target: TargetName, options?: ScanFolderOptions): FileInfo[] | undefined
export function scanProject(dirPath: string, sources: Source<string>[], options: ScanFolderOptions): FileInfo[] | undefined
export function scanProject(dirPath: string, target: Source<string>[] | TargetName, options: undefined | ScanFolderOptions): FileInfo[] | undefined {
	if (typeof target === "string") {
		const preset = Presets[target]
		return scanProject(dirPath, preset.sources, { ...preset, ...options ?? {} })
	}
	else if (Array.isArray(target) && options !== undefined) {
		const paths = FastGlob.sync(
			"**",
			{
				cwd: dirPath,
				ignore: options.ignore,
				markDirectories: options.markDirectories,
				deep: options.deep,
			}
		)
		const sourcesPostRead = target.map(source => ({
			...source,
			fallbacks: readSourcePattern(source.fallbacks, {cwd: dirPath, ignore: options.ignore})
		} as Source))
		return lookProject(paths, sourcesPostRead, options)
	}
	throw new TypeError(`Bad scanProject params. Target param: ${target} (expected TargetName or Source[]). Options: ${options} (expected object or undefined).`)
}

export function readSourcePattern(pattern: string | string[], options?: FastGlob.Options): SourceFile[] {
	const sourceFile = FastGlob.sync(pattern, options)
		.map(pth => ({
			path: pth,
			content: readFileSync(path.join(options?.cwd ?? process.cwd(), pth)).toString()
		} as SourceFile))
	return sourceFile
}

/**
 * Get file paths using pattern.
 * @param pattern The pattern.
 * @param cwd Current working directory.
 * @param ignore Ignore patterns.
 */
export function globFiles(pattern: string | string[], cwd: string, ignore?: string[]): string[] {
	return FastGlob.sync(pattern, { cwd, ignore, onlyFiles: true, dot: true })
}
//#endregion

//#region presets
export interface PresetHumanized extends LookFolderOptions {
	name: string,
	checkCommand: string | undefined,
}
export type Preset = Record<TargetName, ScanFolderOptions & { sources: Source<string>[] }>

export const Presets: Preset = {
	git: {
		allowRelativePaths: false,
		ignore: patternsExclude.concat([gitConfigString("core.excludesFile") ?? '']),
		sources: [
			{ fallbacks: ["**/.gitignore"], patternType: ".*ignore", method: getLookMethodGit() },
		]
	},
	npm: {
		ignore: patternsExclude.concat(npmPatternExclude),
		addPattern: npmPatternInclude,
		sources: [
			{ fallbacks: ["**/package.json"], patternType: "minimatch", method: getLookMethodPropJSON({ prop: "files", negate: true }) },
			{ fallbacks: ["**/.npmignore"], patternType: ".*ignore", method: getLookMethodGit() },
			{ fallbacks: ["**/.gitignore"], patternType: ".*ignore", method: getLookMethodGit() },
		]
	},
	yarn: {
		ignore: patternsExclude.concat(npmPatternExclude),
		addPattern: npmPatternInclude,
		sources: [
			{ fallbacks: ["**/package.json"], patternType: "minimatch", method: getLookMethodPropJSON({ prop: "files", negate: true }) },
			{ fallbacks: ["**/.yarnignore"], patternType: ".*ignore", method: getLookMethodGit() },
			{ fallbacks: ["**/.npmignore"], patternType: ".*ignore", method: getLookMethodGit() },
			{ fallbacks: ["**/.gitignore"], patternType: ".*ignore", method: getLookMethodGit() },
		]
	},
	vsce: {
		ignore: patternsExclude,
		sources: [
			{ fallbacks: ["**/.vscodeignore"], patternType: "minimatch", method: getLookMethodGit() },
		]
	},
}
export function GetFormattedPreset<T extends TargetName>(target: T, style: StyleName, oc: ChalkInstance): PresetHumanized {
	const IsNerd = style.toLowerCase().includes('nerd')
	const result: Record<TargetName, PresetHumanized> = {
		git: {
			...Presets.git,
			name: `${IsNerd ? oc.redBright('\ue65d') + ' ' : ''}Git`,
			checkCommand: `git ls-tree -r ${gitCurrentBranch()} --name-only`,
		},
		npm: {
			...Presets.npm,
			name: `${IsNerd ? oc.red('\ue616') + ' ' : ''}NPM`,
			checkCommand: 'npm pack --dry-run',
		},
		yarn: {
			...Presets.yarn,
			name: `${IsNerd ? oc.magenta('\ue6a7') + ' ' : ''}Yarn`,
			checkCommand: undefined,
		},
		vsce: {
			...Presets.vsce,
			name: `${IsNerd ? oc.red('\udb82\ude1e') + ' ' : ''}VSC Extension`,
			checkCommand: 'vsce ls',
		},
	};
	return result[target]
}
//#endregion
