import {Option, program} from "commander";
import {View, viewList, Sorters, sortNameList, SortName, lookProjectSync} from "./index.js";
import {PresetName, presetNameList, Presets} from "./presets.js";
import {stdout} from "process";
import {default as tree} from "treeify";
import jsonifyPaths from "jsonify-paths";
import ora from "ora"

export {program}

program
	.addOption(new Option("-t, --target [ignorer]").default("git" satisfies PresetName).choices(presetNameList))
	.addOption(new Option("-fl, --filter [filter]").default("included" satisfies View).choices(viewList))
	.addOption(new Option("-sr, --sort [sorter]").default("firstFolders" satisfies SortName).choices(sortNameList))
	.addOption(new Option("--paths"))
	.action(({target, filter, sort, paths: showPaths}) => {
		const spinner = ora()
		spinner.start("Scanning")
		const pathList = lookProjectSync({
			...Presets[target as PresetName | undefined ?? "git"],
			view: filter as View | undefined
		})
		spinner.stop()
		spinner.clear()
		const pathListSorted = pathList.sort(Sorters[sort as SortName | undefined ?? "firstFolders"])
		stdout.write(process.cwd() + "\n")
		if (showPaths) {
			stdout.write(pathListSorted.join('\n') + "\n")
			return
		}
		const pathsAsObject = jsonifyPaths.from(pathListSorted, {delimiter: "/"})
		const pathsAsTree = tree.asTree(pathsAsObject, true, true)
		stdout.write(pathsAsTree)
	})
