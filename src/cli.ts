import { Option, program } from "commander";
import { FilterName, filterNameList, Sorters, sortNameList, SortName, lookProjectSync } from "./index.js";
import { PresetName, presetNameList, GetPresets } from "./presets.js";
import { stdout } from "process";
import { default as tree } from "treeify";
import jsonifyPaths from "jsonify-paths";

export { program }

export const checkCommandHelp: Partial<Record<PresetName, Partial<Record<FilterName, string>>>> = {
	git: {
		included: 'git ls-tree -r <branch name: main/master/...> --name-only'
	},
	npm: {
		included: 'npm pack --dry-run'
	},
	vscodeExtension: {
		included: 'vsce ls'
	}
}

export function safetyHelpCreate(target: PresetName, filter: FilterName): string {
	const command = checkCommandHelp[target]?.[filter] ?? ""
	if (command === "") {
		return ""
	}
	return `\n\nYou can use the \`${command}\` command to check if the list is valid.`
}

program
	.addOption(new Option("-t, --target <ignorer>").default("git" satisfies PresetName).choices(presetNameList))
	.addOption(new Option("-fl, --filter <filter>").default("included" satisfies FilterName).choices(filterNameList))
	.addOption(new Option("-sr, --sort <sorter>").default("firstFolders" satisfies SortName).choices(sortNameList))
	.addOption(new Option("--paths"))
	.addOption(new Option("--sources"))
	.action(({ target, filter, sort, paths: showPaths, sources: showSources }) => {
		const start = Date.now()
		const looked = lookProjectSync({
			...GetPresets()[target as PresetName | undefined ?? "git"],
			filter: filter as FilterName | undefined
		})
		const pathList = looked.map( el => el.toString(showSources))
		const sorter = Sorters[sort as SortName | undefined ?? "firstFolders"]
		const pathListSorted = pathList.sort(sorter)
		stdout.write(process.cwd() + "\n")
		if (showPaths) {
			stdout.write(pathListSorted.join('\n') + "\n")
			return
		} else {
			const pathsAsObject = jsonifyPaths.from(pathListSorted, { delimiter: "/" })
			const pathsAsTree = tree.asTree(pathsAsObject, true, true)
			stdout.write(pathsAsTree)
		}
		stdout.write(`\n`)
		stdout.write(`done in ${Date.now() - start}ms`)
		stdout.write(`\n\n`)
		stdout.write(`${looked.length} files listed (${filter}) for ${target}`)
		stdout.write(safetyHelpCreate(target, filter))
		stdout.write(`\n`)
	})
