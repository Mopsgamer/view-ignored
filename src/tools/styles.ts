import { stdout } from "process"
import { FilterName, FileInfo } from "../lib.js"
import { default as tree } from "treeify";
import jsonifyPaths from "jsonify-paths";
import { ChalkInstance } from "chalk";
import path from "path";

export const styleNameList = ['tree', 'paths', 'treeEmoji', 'treeNerd'] as const
export type StyleName = typeof styleNameList[number]
export type Style = (oc: ChalkInstance, files: FileInfo[], style: StyleName, filter: FilterName) => void

export const Styles: Record<StyleName, Style> = {
	paths(oc, files, styleName) {
		stdout.write(files.map(
			f => `${f.toString({ styleName, usePrefix: true, chalk: oc })}`)
			.join('\n') + "\n")
	},
	tree(oc, files, styleName) {
		const pathsAsObject = jsonifyPaths.from(files.map(f => f.toString({ styleName, usePrefix: true, chalk: oc }, false)), { delimiter: "/" })
		const pathsAsTree = tree.asTree(pathsAsObject, true, true)
		stdout.write(pathsAsTree)
	},
	treeEmoji(oc, files, styleName) {
		const pathsAsObject = jsonifyPaths.from(files.map(f => f.toString({ styleName, usePrefix: true, chalk: oc }, false)), { delimiter: "/" });
		const pathsAsTree = tree.asTree(pathsAsObject, true, true);
		stdout.write(pathsAsTree)
	},
	treeNerd(oc, files, styleName) {
		const pathsAsObject = jsonifyPaths.from(files.map(f => f.toString({ styleName, usePrefix: true, chalk: oc }, false)), { delimiter: "/" });
		const pathsAsTree = tree.asTree(pathsAsObject, true, true);
		stdout.write(pathsAsTree)
	}
}

export interface StyleCondition {
	prefix?: string
	postfix?: string
	ifAny?: string
	ifEmoji?: string
	ifNerd?: string
}
export function styleCondition(styleName: StyleName | undefined, condition: StyleCondition): string {
	if (styleName === undefined) {
		return ''
	}
	const isNerd = styleName.toLowerCase().includes('nerd')
	const isEmoji = styleName.toLowerCase().includes('emoji')

	let result: string = ''
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
