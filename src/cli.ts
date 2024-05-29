import { Option, program } from "commander";
import { FilterName, filterNameList, Sorters, sortNameList, SortName, lookProjectSync, PresetName, StyleName, GetPresets, Styles, presetNameList, styleNameList, LookFileResult } from "./index.js";
import { stdout } from "process";
import { Chalk } from "chalk";
import type { ColorSupportLevel } from "chalk";
import fs from "fs";

export { program }

export const checkCommandHelp: Partial<Record<PresetName, string>> = {
	git: 'git ls-tree -r <branch name: main/master/...> --name-only',
	npm: 'npm pack --dry-run',
	vscodeExtension: 'vsce ls',
}

export function safetyHelpCreate(target: PresetName): string {
	const command = checkCommandHelp[target] ?? ""
	if (command === "") {
		return ""
	}
	return `\n\nYou can use the \`${command}\` command to check if the list is valid.`
}

export function print(options: {
	color?: string,
	target?: PresetName,
	filter?: FilterName,
	sort?: SortName,
	style?: StyleName
}) {
	const start = Date.now()
	options.target ??= "git"
	options.filter ??= "included"
	options.sort ??= "firstFolders"
	options.style ||= "tree"
	const colorLevel = Math.max(0, Math.min(Number(options.color ?? 3), 3)) as ColorSupportLevel
	/** Chalk, but configured by cli. **O**ur **C**halk. */
	const oc = new Chalk({ level: colorLevel })
	const isNerd = options.style.toLowerCase().includes('nerd')
	const isEmoji = options.style.toLowerCase().includes('emoji')

	const preset = GetPresets(options.style, oc)[options.target]
	const looked = lookProjectSync({
		...preset,
		filter: options.filter
	})

	const sorter = Sorters[options.sort]
	const cacheEditDates = new Map<LookFileResult, Date>()
	for (const look of looked) {
		cacheEditDates.set(look, fs.statSync(look.path).mtime)
	}
	const lookedSorted = looked.sort((a, b) => sorter(
		a.toString(), b.toString(),
		cacheEditDates.get(a)!, cacheEditDates.get(b)!
	))
	stdout.write((isNerd ? '\uf115 ' : '') + process.cwd() + "\n")
	Styles[options.style](oc, lookedSorted, options.style, options.filter)
	const time = Date.now() - start
	stdout.write(`\n`)
	stdout.write(`${isEmoji ? '✔️ ' : isNerd ? oc.green('\uf00c ') : ''}Done in ${isNerd && time < 400 ? oc.yellow('\udb85\udc0c') : ''}${time}ms.`)
	stdout.write(`\n\n`)
	stdout.write(`${looked.length} files listed for ${preset.name} (${options.filter}).`)
	stdout.write(safetyHelpCreate(options.target))
	stdout.write(`\n`)
}

program
	.addOption(new Option("-clr, --color <level>").default(3 satisfies ColorSupportLevel).choices(["1", "2", "3", "4"]))
	.addOption(new Option("-t, --target <ignorer>").default("git" satisfies PresetName).choices(presetNameList))
	.addOption(new Option("-fl, --filter <filter>").default("included" satisfies FilterName).choices(filterNameList))
	.addOption(new Option("-sr, --sort <sorter>").default("firstFolders" satisfies SortName).choices(sortNameList))
	.addOption(new Option("-st, --style <style>").default("tree").choices(styleNameList))
	.action(print)

export const cfgProgram = program.command("cfg")
