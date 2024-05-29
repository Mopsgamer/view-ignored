import { stdout } from "process"
import { LookFileResult } from "./lib.js"
import { default as tree } from "treeify";
import jsonifyPaths from "jsonify-paths";

export const styleNameList = ['tree', 'paths', 'treeEmoji', 'treeNerd'] as const
export type StyleName = typeof styleNameList[number]
export type Style = (files: LookFileResult[], style: StyleName) => void

export const Styles: Record<StyleName, Style> = {
	paths(files) {
		stdout.write(files.map(f => `>${f.toString()}`).join('\n') + "\n")
	},
	tree(files) {
		const pathsAsObject = jsonifyPaths.from(files.map(f => f.toString()), { delimiter: "/" })
		const pathsAsTree = tree.asTree(pathsAsObject, true, true)
		stdout.write(pathsAsTree)
	},
	treeEmoji(files) {
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
	treeNerd(files) {
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