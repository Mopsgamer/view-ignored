import { stdout } from "process"
import { FilterName, FileInfo } from "../index.js"
import { default as tree } from "treeify";
import jsonifyPaths from "jsonify-paths";
import { ChalkInstance } from "chalk";
import path from "path";

export const styleNameList = ['tree', 'paths', 'treeEmoji', 'treeNerd'] as const
export type StyleName = typeof styleNameList[number]
export type Style = (oc: ChalkInstance, files: FileInfo[], style: StyleName, filter: FilterName) => void
export function isStyleName(value: unknown): value is StyleName {
	return typeof value === "string" && styleNameList.includes(value as StyleName)
}

const printTree: Style = function (oc, files, styleName) {
	const pathsAsObject = jsonifyPaths.from(files.map(f => f.toString({ styleName, usePrefix: true, chalk: oc }, false)), { delimiter: "/" })
	const pathsAsTree = tree.asTree(pathsAsObject, true, true)
	stdout.write(pathsAsTree)
}

export const Styles: Record<StyleName, Style> = {
	paths(oc, files, styleName) {
		stdout.write(files.map(
			f => `${f.toString({ styleName, usePrefix: true, chalk: oc })}`)
			.join('\n') + "\n")
	},
	tree: printTree,
	treeEmoji: printTree,
	treeNerd: printTree
}

/**
 * Formatting options for the {@link styleCondition}.
 */
export interface StyleCondition {
	/**
	 * @default ""
	 */
	prefix?: string

	/**
	 * @default ""
	 */
	postfix?: string

	/**
	 * If style is not an emoji or nerd use this string.
	 * @default ""
	 */
	ifAny?: string

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
 * @param styleName The style name.
 * @param condition Formatting options.
 */
export function styleCondition(styleName: StyleName | undefined, condition: StyleCondition): string {
	if (styleName === undefined) {
		return ''
	}
	const isNerd = styleName.toLowerCase().includes('nerd')
	const isEmoji = styleName.toLowerCase().includes('emoji')

	let result: string = condition.ifAny ?? ''
	if (isEmoji) {
		result = condition.ifEmoji ?? result
	} else if (isNerd) {
		result = condition.ifNerd ?? result
	} else {
		result = condition.ifAny ?? result
	}
	if (result !== '') {
		result = (condition.prefix ?? '') + result + (condition.postfix ?? '')
	}
	return result
}

/**
 * Adds the file icon prefix to the string.
 * @param styleName The style name.
 * @param filePath The full file path.
 */
export function styleConditionFile(styleName: StyleName | undefined, filePath: string): string {
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
	return styleCondition(styleName, {
		ifEmoji: '📄',
		ifNerd: icon,
		postfix: ' '
	})
}
