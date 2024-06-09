import { LookMethod, LookMethodData } from "../lib.js"
import getValue from "get-value"
import { Looker } from "../looker.js"

//#region predefined patterns
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
		if (result?.constructor !== Object) {
			throw new Error(`JSON is not dictionary`)
		}
		return result
	} catch (error) {
		return
	}
}
//#endregion

//#region look methods
export function superPresetLookOptions(looker: Looker, options?: GetLookMethodGitOptions) {
	const { negate = false } = options ?? {};
	looker.isNegated = negate
}

export interface GetLookMethodGitOptions {
	negate?: boolean
}

export interface GetLookMethodPropJSONOptions extends GetLookMethodGitOptions {
	parserFunc?: ParserFunction,
	prop: string,
}

export function getLookMethodPropJSON(options: GetLookMethodPropJSONOptions) {
	const { parserFunc = parserJSONDict, prop } = options
	return (function (data: LookMethodData) {
		const { looker, sourceFile: source } = data
		const parsed = parserFunc(source.content)
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

export function getLookMethodGit(options?: GetLookMethodGitOptions) {
	return (function (data: LookMethodData) {
		const { looker, sourceFile: source } = data
		if (!looker.isValidPattern(source.content)) {
			return false
		}
		superPresetLookOptions(looker, options)
		looker.add(source.content)
		return true
	} satisfies LookMethod)
}
//#endregion
