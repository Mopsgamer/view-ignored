import { LookMethod, LookMethodData, Looker } from "../browser/index.js"
import getValue from "get-value"

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
export type ParserFunction<T> = (text: string) => T

export const parserJSONDict: ParserFunction<object> = (text) => {
	const result = JSON.parse(text)
	if (result?.constructor !== Object) {
		throw new TypeError(`JSON is not dictionary`)
	}
	return result
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

export interface GetLookMethodPropJSONOptions<T> extends GetLookMethodGitOptions {
	parserFunc?: ParserFunction<T>,
	prop: string,
}

export function getLookMethodPropJSON(options: GetLookMethodPropJSONOptions<object>) {
	const { parserFunc = parserJSONDict, prop } = options
	return (function (data: LookMethodData) {
		const { looker, sourceFile: source } = data
		let parsed: object
		try {
			parsed = parserFunc(source.content)
		} catch {
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
