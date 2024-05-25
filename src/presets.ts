import { LookFileOptions, LookMethod, LookMethodData, Looker, gitConfigString } from "./lib.js"
import getValue from "get-value"

export const presetNameList = ['git', 'npm', 'yarn', 'vscodeExtension'] as const
export type PresetName = typeof presetNameList[number]
export type Preset = LookFileOptions

//#region native patterns
export const patternsExclude: string[] = [
	".git/**",
	"node_modules/**",
	".DS_Store/**"
]
export const npmPatternExclude = [
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
];
export const npmPatternInclude = [
	'bin/',
	'package.json',
	'README',
	'README.*',
	'LICENSE',
	'LICENSE.*',
	'LICENCE',
	'LICENCE.*',
];
//#endregion

//#region parsers
export type ParserFunction = (text: string) => object | undefined

export const parserJSONDict: ParserFunction = (text) => {
	try {
		const result = JSON.parse(text)
		const isDict = typeof result === 'object' && result !== null && !Array.isArray(result)
		if (!isDict) throw new Error(`JSON is not dictionary`)
		return result
	} catch (error) {
		return
	}
}
//#endregion

//#region look methods
export function superPresetLookOptions(looker: Looker, options?: PresetLookOptions) {
	const { negate = false } = options ?? {};
	looker.negated = negate
}

export interface PresetLookOptions {
	negate?: boolean
}

export interface PresetLookPropertyOptions extends PresetLookOptions {
	parserFunc?: ParserFunction,
	prop: string,
}

export const lookProperty = (options: PresetLookPropertyOptions) => {
	const { parserFunc = parserJSONDict, prop } = options
	return (function (data: LookMethodData) {
		const { looker, sourceContent } = data
		const parsed = parserFunc(sourceContent)
		if (!parsed) {
			return false
		}
		const propVal = getValue(parsed, prop)
		if (!Array.isArray(propVal)) {
			return false
		}
		superPresetLookOptions(looker, options)
		looker.add(propVal)
		return true
	} satisfies LookMethod)
}

export const lookGit = ((options?: PresetLookOptions) => {
	return (function (data: LookMethodData) {
		const { looker, sourceContent } = data
		if (!looker.isValidPattern(sourceContent)) {
			return false
		}
		superPresetLookOptions(looker, options)
		looker.add(sourceContent)
		return true
	} satisfies LookMethod)
})
//#endregion

//#region presets
export const GetPresets: () => Record<PresetName, Preset> = () => ({
	// git ls-tree -r main --name-only
	git: {
		allowRelativePaths: false,
		hidePattern: patternsExclude.concat([gitConfigString("core.excludesFile")]),
		sources: [
			["**/.gitignore", lookGit()]
		]
	},
	// npm pack --dry-run
	npm: {
		hidePattern: patternsExclude.concat(npmPatternExclude),
		addPattern: npmPatternInclude,
		sources: [
			["**/package.json", lookProperty({ prop: "files", negate: true })],
			["**/.npmignore", lookGit()],
			["**/.gitignore", lookGit()]
		]
	},
	yarn: {
		hidePattern: patternsExclude.concat(npmPatternExclude),
		addPattern: npmPatternInclude,
		sources: [
			["**/package.json", lookProperty({ prop: "files", negate: true })],
			["**/.yarnignore", lookGit()],
			["**/.npmignore", lookGit()],
			["**/.gitignore", lookGit()]
		]
	},
	vscodeExtension: {
		hidePattern: patternsExclude,
		sources: [
			["**/.vscodeignore", lookGit()],
			["**/.gitignore", lookGit()]
		]
	},
})
//#endregion