import { FileInfo } from "../index.js"
import { default as tree } from "treeify";
import jsonifyPaths from "jsonify-paths";
import { ChalkInstance } from "chalk";
import path from "path";

export interface FormatFilesOptions {
	/**
	 * @default false
	 */
	showSources?: boolean
	/**
	 * @default "paths"
	 */
	style: StyleName,
	/**
	 * @default "paths"
	 */
	decor?: DecorName,
	chalk: ChalkInstance,
	/**
	 * @default Infinity
	 */
	depth?: number
}

/**
 * @returns Prints a readable file list. Here is '\n' ending.
 */
export function formatFiles(files: FileInfo[], options: FormatFilesOptions): string {
	const { showSources = false, chalk, decor = "normal", style, depth = Infinity } = options ?? {};

	const isPaths = style === "paths"
	const paths = files.map(f => f.toString({ fileIcon: decor, usePrefix: true, chalk: chalk, source: showSources, entire: isPaths }))
		.filter(p => Array.from(p).filter(c => c === '/').length < depth)

	if (isPaths) {
		return paths.join('\n') + '\n'
	}

	// isTree
	const pathsAsObject = jsonifyPaths.from(paths, { delimiter: "/" })
	const pathsAsTree = tree.asTree(pathsAsObject, true, true)
	return pathsAsTree
}

/**
 * Contains all style names.
 */
export const styleNameList = ['tree', 'paths'] as const
/**
 * Contains all style names as a type.
 */
export type StyleName = typeof styleNameList[number]
/**
 * Checks if the value is the {@link StyleName}.
 */
export function isStyleName(value: unknown): value is StyleName {
	return typeof value === "string" && styleNameList.includes(value as StyleName)
}

/**
 * Contains all decor names.
 */
export const decorNameList = ['normal', 'emoji', 'nerdfonts'] as const
/**
 * Contains all decor names as a type.
 */
export type DecorName = typeof decorNameList[number]
/**
 * Checks if the value is the {@link DecorName}.
 */
export function isDecorName(value: unknown): value is DecorName {
	return typeof value === "string" && decorNameList.includes(value as DecorName)
}

/**
 * Formatting options for the {@link decorCondition}.
 */
export interface DecorConditionOptions {
	/**
	 * @default ""
	 */
	prefix?: string

	/**
	 * @default ""
	 */
	postfix?: string

	/**
	 * If the decor is not an emoji or nerd use this string.
	 * @default ""
	 */
	ifNormal?: string

	/**
	 * If style name (lowercase) contains `emoji` use this string.
	 * @default ""
	 */
	ifEmoji?: string

	/**
	 * If style name (lowercase) contains `nerd` use this string.
	 * @default ""
	 */
	ifNerd?: string
}

/**
 * Formats the string for specific style types.
 * @param decor The decor name.
 * @param condition Formatting options.
 */
export function decorCondition(decor: DecorName, condition: DecorConditionOptions): string {
	let result: string = condition.ifNormal ?? ''
	if (decor === 'emoji') {
		result = condition.ifEmoji ?? result
	} else if (decor === 'nerdfonts') {
		result = condition.ifNerd ?? result
	}

	if (result !== '') {
		result = (condition.prefix ?? '') + result + (condition.postfix ?? '')
	}
	return result
}

/**
 * Returns file icon for the file name & extension.
 * @param decor The decor name.
 * @param filePath The full file path.
 */
export function decorFile(decor: DecorName | undefined, filePath: string): string {
	const parsed = path.parse(filePath)
	let icon = ''
	switch (parsed.ext.toLocaleLowerCase()) {
		case ".js":
		case ".cjs":
		case ".mjs":
			icon = '\ue60c'
			break;
		case ".ts":
		case ".cts":
		case ".mts":
			icon = '\ue628'
			break;
		case ".styl":
			icon = '\ue600'
			break;
		case ".less":
			icon = '\ue60b'
			break;
		case ".scss":
		case ".sass":
			icon = '\ue603'
			break;
		case ".go":
			icon = '\ue65e'
			break;

		case ".json":
		case ".jsonc":
		case ".json5":
			icon = '\ue60b'
			break;
		case ".yml":
		case ".yaml":
			icon = '\ue6a8'
			break;

		case ".gitignore":
			icon = '\ue65d'
			break;
		case ".npmignore":
			icon = '\ue616'
			break;
		case ".dockerignore":
			icon = '\ue650'
			break;

		default:
			icon = '\ue64e'
			break;
	}
	switch (parsed.name.toLocaleLowerCase()) {
		case "readme":
			icon = '\ue66a'
			break;
		case "changelog":
			icon = '\ue641'
			break;
		case "tsconfig":
			icon = '\ue69d'
			break;
		case "eslint.config":
			icon = '\ue655'
			break;
		case "stylelint.config":
			icon = '\ue695'
			break;

		default:
			break;
	}
	if (!decor) {
		return ''
	}
	return decorCondition(decor, {
		ifEmoji: '📄',
		ifNerd: icon,
		postfix: ' '
	})
}
