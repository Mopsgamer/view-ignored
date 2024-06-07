import { stdout } from "process"
import { FilterName, FileInfo } from "../lib.js"
import { default as tree } from "treeify";
import jsonifyPaths from "jsonify-paths";
import { ChalkInstance } from "chalk";

export const styleNameList = ['tree', 'paths', 'treeEmoji', 'treeNerd'] as const
export type StyleName = typeof styleNameList[number]
export type Style = (oc: ChalkInstance, files: FileInfo[], style: StyleName, filter: FilterName) => void

export function prefixIgn(f: FileInfo) {
	return (f.ignored ? '!' : '+') + f.toString()
}

export function chalkIgn(f: FileInfo, oc: ChalkInstance) {
	return (f.ignored ? oc.red : oc.green)(prefixIgn(f))
}

export const Styles: Record<StyleName, Style> = {
	paths(oc, files) {
		stdout.write(files.map(
			f => `${chalkIgn(f, oc)}`)
			.join('\n') + "\n")
	},
	tree(oc, files) {
		const pathsAsObject = jsonifyPaths.from(files.map(f => f.toString()), { delimiter: "/" })
		const pathsAsTree = tree.asTree(pathsAsObject, true, true)
		stdout.write(pathsAsTree)
	},
	treeEmoji(oc, files) {
		const pathsAsObject = jsonifyPaths.from(files.map(f => f.toString()), { delimiter: "/" });
		(function walk(tree: jsonifyPaths.Tree): void {
			for (const [key, value] of Object.entries(tree)) {
				if (typeof value === 'object') {
					walk(value)
				}
				const icon = (Object.keys(value).length ? '📂' : '📄') + ' '
				Object.defineProperty(tree, icon + key,
					Object.getOwnPropertyDescriptor(tree, key)!);
				delete tree[key];
			}
		})(pathsAsObject)
		const pathsAsTree = tree.asTree(pathsAsObject, true, true);
		stdout.write(pathsAsTree)
	},
	treeNerd(oc, files) {
		const pathsAsObject = jsonifyPaths.from(files.map(f => f.toString()), { delimiter: "/" });
		(function walk(tree: jsonifyPaths.Tree): void {
			for (const [key, value] of Object.entries(tree)) {
				if (typeof value === 'object') {
					walk(value)
				}
				const icon = (Object.keys(value).length ? '\uf115' : '\uf016') + ' '
				Object.defineProperty(tree, icon + key,
					Object.getOwnPropertyDescriptor(tree, key)!);
				delete tree[key];
			}
		})(pathsAsObject)
		const pathsAsTree = tree.asTree(pathsAsObject, true, true);
		stdout.write(pathsAsTree)
	}
}