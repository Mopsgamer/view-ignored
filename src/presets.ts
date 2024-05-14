import {LookFileOptions, LookMethod, gitConfigString} from "./lib.js"
import * as JSONC from "jsonc-parser"
import getValue from "get-value"
import ignore from "ignore"

export const presetNameList = ['git', 'npm', 'yarn', 'vscodeExtension'] as const
export type PresetName = typeof presetNameList[number]
export type Preset = LookFileOptions

//#region native patterns
const npmNativeIgnorePattern = [
	'.*.swp',
	'._*',
	'.DS_Store',
	'.git',
	'.gitignore',
	'.hg',
	'.npmignore',
	'.npmrc',
	'.lock-wscript',
	'.svn',
	'.wafpickle-*',
	'config.gypi',
	'CVS',
	'npm-debug.log',
	'!package.json',
	'!README',
	'!README.*',
	'!CHANGELOG',
	'!CHANGELOG.*',
	'!LICENSE',
	'!LICENSE.*',
	'!LICENCE',
	'!LICENCE.*',
];
const npmNativeIncludePattern = [
	'package.json',
	'README',
	'README.*',
	'CHANGELOG',
	'CHANGELOG.*',
	'LICENSE',
	'LICENSE.*',
	'LICENCE',
	'LICENCE.*',
];
//#endregion

//#region readers
const readIgnNpm = ((data) => {
	try {
		const [instance, negated] = readIgnGit(data)
		instance.add(npmNativeIgnorePattern)
		return [instance, negated]
	} catch (error) {
		const [instance, negated] =  readIncJsoncProp("files")(data)
		instance.add(npmNativeIncludePattern)
		return [instance, negated]
	}
}) as LookMethod
const readIncJsoncProp = (prop: string) => {
	return (function (data) {
		const {instance, ignContent, ignPath} = data
		const errors: JSONC.ParseError[] = []
		const parsed = JSONC.parse(ignContent, errors)
		if (!errors.length) {
			instance.add(getValue(parsed, prop))
			return [instance, true]
		}
		throw new Error(`Invalid jsonc in '${ignPath}'.`)
	}) as LookMethod
}
const readIgnGit = ((data) => {
	const {instance, ignContent, ignPath} = data
	if (ignore.default.isPathValid(ignContent)) {
		instance.add(ignContent)
		return [instance, false]
	}
	throw new Error(`Invalid gitignore pattern in '${ignPath}'. Do you use current dir prefix './path' ?`)
}) as LookMethod
//#endregion

//#region presets
export const Presets: Record<PresetName, Preset> = {
	// git ls-tree -r main --name-only
	git: {
		method: readIgnGit,
		allowRelativePaths: false,
		ignore: [gitConfigString("core.excludesFile")],
		pattern: ["**/.gitignore"]
	},
	// npm pack --dry-run
	npm: {
		method: readIgnNpm,
		pattern: ["**/package.json", "**/.npmignore", "**/.gitignore"]
	},
	yarn: {
		method: readIgnNpm,
		pattern: ["**/package.json", "**/.yarnignore", "**/.npmignore", "**/.gitignore"]
	},
	vscodeExtension: {
		method: readIgnGit,
		pattern: ["**/.vscodeignore", "**/.gitignore"]
	},
}
//#endregion