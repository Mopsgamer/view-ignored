import {Option, program} from "commander";
import {View, viewList, Sorters, sortNameList, SortName, lookProjectSync} from "./index.js";
import {PresetName, presetNameList, Presets} from "./presets.js";
import {stdout} from "process";
import {default as tree} from "treeify";
import jsonifyPaths from "jsonify-paths";
import ora, {spinners} from "ora"

export {program}

program
	.addOption(new Option("-t, --target [ignorer]").default("git" satisfies PresetName).choices(presetNameList))
	.addOption(new Option("-fl, --filter [filter]").default("included" satisfies View).choices(viewList))
	.addOption(new Option("-sr, --sort [sorter]").default("firstFolders" satisfies SortName).choices(sortNameList))
	.addOption(new Option("--paths"))
	.action(({target, filter, sort, paths: showPaths}) => {
		const spinner = ora({spinner: spinners.dots10})
		spinner.start("Scanning")
		const pathList = lookProjectSync({
			...Presets[target as PresetName | undefined ?? "git"],
			view: filter as View | undefined
		})
		spinner.stop()
		spinner.clear()
		const pathListSorted = pathList.sort(Sorters[sort as SortName | undefined ?? "firstFolders"])
		if (showPaths) {
			stdout.write(pathListSorted.join('\n') + "\n")
			return
		}
		stdout.write(tree.asTree(jsonifyPaths.from(pathListSorted), false, true))
	})
