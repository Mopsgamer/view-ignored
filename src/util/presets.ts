import { LookFileOptions, LookFolderOptions, LookMethod, LookMethodData, Looker, TargetName, gitConfigString } from "../lib.js"
import getValue from "get-value"
import { StyleName } from "./styles.js"
import { ChalkInstance } from "chalk"

export interface Preset extends LookFolderOptions {
	name: string,
	checkCommand: string | undefined,
}

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
	looker.isNegated = negate
}

export interface PresetLookOptions {
	negate?: boolean
}

export interface PresetgetLookMethodPropJSONOptions extends PresetLookOptions {
	parserFunc?: ParserFunction,
	prop: string,
}

export function getLookMethodPropJSON(options: PresetgetLookMethodPropJSONOptions) {
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

export function getLookMethodGit(options?: PresetLookOptions) {
	return (function (data: LookMethodData) {
		const { looker, sourceContent } = data
		if (!looker.isValidPattern(sourceContent)) {
			return false
		}
		superPresetLookOptions(looker, options)
		looker.add(sourceContent)
		return true
	} satisfies LookMethod)
}
//#endregion

//#region presets
export const Presets = {
	git: {
		allowRelativePaths: false,
		hidePattern: patternsExclude.concat([gitConfigString("core.excludesFile") ?? '']),
		sources: [
			["**/.gitignore", ".*ignore", getLookMethodGit()]
		]
	},
	npm: {
		hidePattern: patternsExclude.concat(npmPatternExclude),
		addPattern: npmPatternInclude,
		sources: [
			["**/package.json", "minimatch", getLookMethodPropJSON({ prop: "files", negate: true })],
			["**/.npmignore", ".*ignore", getLookMethodGit()],
			["**/.gitignore", ".*ignore", getLookMethodGit()]
		]
	},
	yarn: {
		hidePattern: patternsExclude.concat(npmPatternExclude),
		addPattern: npmPatternInclude,
		sources: [
			["**/package.json", "minimatch", getLookMethodPropJSON({ prop: "files", negate: true })],
			["**/.yarnignore", ".*ignore", getLookMethodGit()],
			["**/.npmignore", ".*ignore", getLookMethodGit()],
			["**/.gitignore", ".*ignore", getLookMethodGit()]
		]
	},
	vscodeExtension: {
		hidePattern: patternsExclude,
		sources: [
			["**/.vscodeignore", "minimatch", getLookMethodGit()],
		]
	},
} satisfies Record<TargetName, LookFolderOptions> as Record<TargetName, LookFolderOptions>
export function GetFormattedPreset<T extends TargetName>(target: T, style: StyleName, oc: ChalkInstance): Preset {
	const IsNerd = style.toLowerCase().includes('nerd')
	const result: Record<TargetName, Preset> = {
		git: {
			...Presets.git,
			name: `${IsNerd ? oc.redBright('\ue65d') + ' ' : ''}Git`,
			checkCommand: 'git ls-tree -r <branch name: main/master/...> --name-only',
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
		vscodeExtension: {
			...Presets.vscodeExtension,
			name: `${IsNerd ? oc.red('\udb82\ude1e') + ' ' : ''}Visual Studio: Code - Extension`,
			checkCommand: 'vsce ls',
		},
	};
	return result[target]
}
//#endregion