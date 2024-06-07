import { Argument, InvalidArgumentError, Option, program } from "commander";
import { FilterName, Tools, lookProject, TargetName, FileInfo, PresetHumanized, scanProject } from "./index.js";
import { stdout } from "process";
import { Chalk } from "chalk";
import type { ChalkInstance, ColorSupportLevel } from "chalk";
import fs from "fs";
import { configValues, configEditor, ConfigKey, Config, configKeyList, configFilePath } from "./config.js";

export { program }

export function safetyHelpCreate(preset: PresetHumanized, oc: ChalkInstance): string {
	const command = preset.checkCommand ?? ""
	if (command === "") {
		return ""
	}
	return '\n\n' + oc.cyan(`You can use the \`${oc.white(command)}\` command to check if the list is valid.`)
}

export interface Flags {
	color?: string,
	target?: TargetName,
	filter?: FilterName,
	sort?: Tools.SortName,
	style?: Tools.StyleName
}

program
	.addOption(new Option("-clr, --color <level>").default(configEditor.get("color")).choices(configValues.color))
	.addOption(new Option("-t, --target <ignorer>").default(configEditor.get("target")).choices(configValues.target))
	.addOption(new Option("-fl, --filter <filter>").default(configEditor.get("filter")).choices(configValues.filter))
	.addOption(new Option("-sr, --sort <sorter>").default(configEditor.get("sort")).choices(configValues.sort))
	.addOption(new Option("-st, --style <style>").default(configEditor.get("style")).choices(configValues.style))
	.action(actionPrint)

export const cfgProgram = program
	.command("config")
	.alias('cfg')
	.description('cli config manipulation.')

export const argConfigKeyVal = new Argument('<pair>', 'pair "key=value"').argParser(parseArgKeyVal)
export const argConfigKey = new Argument('[key]', 'setting').choices(configKeyList)

cfgProgram
	.command('path').description('print the config file path')
	.action(actionCfgPath)
cfgProgram
	.command('reset').description('reset config by deleting the file. alias for no-prop unset')
	.action(actionCfgReset)
cfgProgram
	.command('set').description('set config property using syntax "key=value"')
	.addArgument(argConfigKeyVal)
	.action(actionCfgSet)
cfgProgram
	.command('unset').description("unset all configuration values or a specific one")
	.addArgument(argConfigKey)
	.action(actionCfgUnset)
cfgProgram
	.command('get').description('print a list of all configuration values or a specific one')
	.option('--safe', 'use default value(s) as fallback for printing')
	.addArgument(argConfigKey)
	.action(actionCfgGet)

export function parseArgKey(key: string): void {
	if (!configKeyList.includes(key as ConfigKey)) {
		throw new InvalidArgumentError(`Allowed config properties are ${configKeyList.join(', ')}. Got ${key}.`)
	}
}

export function parseArgKeyVal(pair: string): void {
	const str = pair.split('=')
	if (str.length !== 2) {
		throw new InvalidArgumentError(`Ivalid syntax. Expected 'setting=value'. Got ${pair}.`)
	}
	const [key, val] = str as [ConfigKey, Config[ConfigKey]]
	parseArgKey(key)
	if (!configValues[key].includes(val as Config[ConfigKey] as never)) {
		throw new InvalidArgumentError(`Allowed config properties are ${configValues[key].join(', ')}. Got ${val}.`)
	}
}

export function actionPrint(flags: Flags): void {
	const start = Date.now()
	flags.target ??= "git"
	flags.filter ??= "included"
	flags.sort ??= "firstFolders"
	flags.style ||= "tree"
	const colorLevel = Math.max(0, Math.min(Number(flags.color ?? 3), 3)) as ColorSupportLevel
	/** Chalk, but configured by view-ignored cli. */
	const oc = new Chalk({ level: colorLevel })
	const isNerd = flags.style.toLowerCase().includes('nerd')
	const isEmoji = flags.style.toLowerCase().includes('emoji')

	const formattedPreset = Tools.GetFormattedPreset(flags.target, flags.style, oc)
	const looked = scanProject(process.cwd(), Presets, {
		...formattedPreset,
		filter: flags.filter
	})

	const sorter = Tools.Sorters[flags.sort]
	const cacheEditDates = new Map<FileInfo, Date>()
	for (const look of looked) {
		cacheEditDates.set(look, fs.statSync(look.filePath).mtime)
	}
	const lookedSorted = looked.sort((a, b) => sorter(
		a.toString(), b.toString(),
		cacheEditDates.get(a)!, cacheEditDates.get(b)!
	))
	stdout.write((isNerd ? '\uf115 ' : '') + process.cwd() + "\n")
	Tools.Styles[flags.style](oc, lookedSorted, flags.style, flags.filter)
	const time = Date.now() - start
	stdout.write(`\n`)
	stdout.write(`${isEmoji ? '✔️ ' : isNerd ? oc.green('\uf00c ') : ''}Done in ${isNerd && time < 400 ? oc.yellow('\udb85\udc0c') : ''}${time}ms.`)
	stdout.write(`\n\n`)
	stdout.write(`${looked.length} files listed for ${formattedPreset.name} (${flags.filter}).`)
	stdout.write(safetyHelpCreate(formattedPreset, oc))
	stdout.write('\n')
}

export function actionCfgPath(): void {
	stdout.write(configFilePath)
	stdout.write('\n')
}

export function actionCfgReset(): void {
	configEditor.unset().save()
	stdout.write(configEditor.getPairString())
	stdout.write('\n')
}

export function actionCfgSet(pair: string): void {
	const [key, val] = pair.split('=') as [ConfigKey, Config[ConfigKey]]
	configEditor.set(key, val).save()
	stdout.write(configEditor.getPairString(key))
	stdout.write('\n')
}

export function actionCfgUnset(key: ConfigKey | undefined): void {
	if (key !== undefined) {
		configEditor.unset(key).save()
	}
	stdout.write(configEditor.getPairString(key))
	stdout.write('\n')
}

export function actionCfgGet(key: ConfigKey | undefined, options: { safe?: boolean }): void {
	stdout.write(configEditor.getPairString(key, options.safe ?? false))
	stdout.write('\n')
}
