import fs from "fs";
import { Chalk, ChalkInstance, ColorSupportLevel } from "chalk";
import { Argument, InvalidArgumentError, Option, Command } from "commander";
import * as Config from "./config.js";
import { BuiltIns, loadPlugins, targetGet } from "./browser/binds/index.js";
import { decorCondition, DecorName, formatFiles, StyleName } from "./browser/styling.js";
import { SortName } from "./browser/sorting.js";
import { FileInfo, FilterName, scanProject, Sorting } from "./lib.js";
import { formatConfigConflicts } from "./styling.js";

/**
 * Prepare for {@link program}.parse().
 */
export async function programInit() {
	const flags: ProgramFlags = program.optsWithGlobals()
	const chalk = getChalk(flags)
	try {
		Config.configManager.load()
	} catch (error) {
		formatConfigConflicts(chalk, flags.decor, error)
		return
	}
	await BuiltIns
	program.parseOptions(process.argv)
	await loadPlugins(flags.plugin)
	optionsInit()
	program.parse()
}

/** Chalk, but configured by view-ignored cli. */
export function getChalk(flags: ProgramFlags): ChalkInstance {
	const colorLevel = (flags.noColor ? 0 : Math.max(0, Math.min(Number(flags.color ?? 3), 3))) as ColorSupportLevel
	const chalk = new Chalk({ level: colorLevel })
	return chalk
}

/**
 * Command-line entire program flags.
 */
export interface ProgramFlags {
	plugin: string[]
	noColor: boolean
	color: string
	decor: DecorName
}

/**
 * Command-line 'scan' command flags.
 */
export interface ScanFlags extends ProgramFlags {
	target: string
	filter: FilterName
	sort: SortName
	style: StyleName
	showSources: boolean
}

/**
 * Command-line 'cfg get' command flags.
 */
export interface ConfigGetFlags {
	defs: boolean
}

export const optionPlugin = new Option('--plugin <modules...>')
export const optionNoColor = new Option("--no-color").default(false)
export const optionColor = new Option("--color <level>")
Config.configValuePutChoices(optionColor, "color")
export const optionDecor = new Option("--decor <decor>")
Config.configValuePutChoices(optionDecor, "decor")

/**
 * `view-ignored` command-line programl
 */
export const program = new Command()
	.addOption(optionPlugin)
	.addOption(optionColor)
	.addOption(optionNoColor)

export const scanOptionTarget = new Option("--target <ignorer>")
export const scanOptionFilter = new Option("--filter <filter>")
Config.configValuePutChoices(scanOptionFilter, "filter")

export const scanOptionSort = new Option("--sort <sorter>")
Config.configValuePutChoices(scanOptionSort, "sort")

export const scanOptionStyle = new Option("--style <style>")
Config.configValuePutChoices(scanOptionStyle, "style")

export const scanOptionShowSources = new Option("--show-sources")
	.argParser(parseArgBool)
Config.configValuePutChoices(scanOptionShowSources, "showSources")

/**
 * Init the command-line, parse arguments and invoke the program.
 */
export function optionsInit() {
	Config.configValuePutChoices(scanOptionTarget, "target")

	scanProgram
		.addOption(scanOptionTarget)
}

/**
 * Command-line 'scan' command.
 */
export const scanProgram = program
	.command("scan")
	.aliases(['sc'])
	.description('get ignored paths')
	.action(actionScan)
	.addOption(optionPlugin)
	.addOption(optionNoColor)
	.addOption(optionColor)
	.addOption(scanOptionFilter)
	.addOption(scanOptionSort)
	.addOption(scanOptionStyle)
	.addOption(scanOptionShowSources)

/**
 * Command-line 'config' command.
 */
export const cfgProgram = program
	.command("config")
	.alias('cfg')
	.description('cli config manipulation')

/**
 * Command-line argument: key=value pair.
 * @see {@link parseArgKeyVal}
 */
export const argConfigKeyVal = new Argument('<pair>', 'pair "key=value"').argParser(parseArgKeyVal)
/**
 * Command-line argument: config property.
 * @see {@link Config.configKeyList}
 */
export const argConfigKey = new Argument('[key]', 'setting').choices(Config.configKeyList)

export const cfgGetOption = new Option('--defs', 'use default value(s) as fallback for printing').default(false)

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
	.addOption(cfgGetOption)
	.addArgument(argConfigKey)
	.action(actionCfgGet)

export function parseArgBool(arg: string): "true" | "false" {
	return String(!!arg) as "true" | "false"
}

export function parseArgKey(key: string): string {
	if (!Config.isConfigKey(key)) {
		throw new InvalidArgumentError(`Allowed config properties are ${Config.configKeyList.join(', ')}. Got ${key}.`)
	}
	return key;
}

export function parseArgKeyVal(pair: string): Config.ConfigPair {
	const result = pair.split('=') as Config.ConfigPair
	if (result.length !== 2) {
		throw new InvalidArgumentError(`Invalid syntax. Expected 'setting=value'. Got '${pair}'.`)
	}
	const [key, val] = result
	parseArgKey(key)
	if (!Config.isConfigValue(key, val)) {
		const list = Config.configValueList(key)
		if (list === undefined) {
			throw new InvalidArgumentError(`Got '${val}'.`)
		}
		throw new InvalidArgumentError(`Allowed config properties are ${list.join(', ')}. Got '${val}'.`)
	}
	return result
}

/**
 * Command-line 'scan' command action.
 */
export async function actionScan(flags: ScanFlags): Promise<void> {
	const start = Date.now()
	const chalk = getChalk(flags)

	const fileInfoList = await scanProject(flags.target, { filter: flags.filter })

	if (!fileInfoList) {
		console.error(`Bad source for ${flags.target}.`)
		process.exit(1)
	}

	const sorter = Sorting[flags.sort]
	const cacheEditDates = new Map<FileInfo, Date>()
	for (const look of fileInfoList) {
		cacheEditDates.set(look, fs.statSync(look.filePath).mtime)
	}
	const bind = targetGet(flags.target)!
	const lookedSorted = fileInfoList.sort((a, b) => sorter(
		a.toString(), b.toString(),
		cacheEditDates.get(a)!, cacheEditDates.get(b)!
	))
	console.log(process.cwd())
	formatFiles(lookedSorted, { chalk, style: flags.style, decor: flags.decor, showSources: flags.showSources })
	const time = Date.now() - start
	console.log()
	const checkSymbol = decorCondition(flags.decor, { ifEmoji: '✅', ifNerd: '\uf00c', postfix: ' ' })
	const fastSymbol = decorCondition(flags.decor, { ifEmoji: '⚡', ifNerd: '\udb85\udc0c' })
	console.log(`${chalk.green(checkSymbol)}Done in ${time < 400 ? chalk.yellow(fastSymbol) : ''}${time}ms.\n`)
	const name = typeof bind.name === "string" ? bind.name : decorCondition(flags.decor, bind.name)
	console.log(`${fileInfoList.length} files listed for ${name} (${flags.filter}).\n`)
	const infoSymbol = decorCondition(flags.decor, { ifEmoji: 'ℹ️', ifNerd: '\ue66a', postfix: ' ' })
	console.log(`${chalk.blue(infoSymbol)}You can use '${chalk.magenta(bind.testCommand ?? "")}' to check if the list is valid.\n`)
}

/**
 * Command-line 'config path' command action.
 */
export function actionCfgPath(): void {
	console.log(Config.configFilePath)
}

/**
 * Command-line 'config reset' command action
 */
export function actionCfgReset(): void {
	Config.configManager.unset().save()
	console.log(Config.configManager.getPairString())
}

/**
 * Command-line 'config set' command action
 */
export function actionCfgSet(pair: Config.ConfigPair): void {
	const [key, val] = pair
	Config.configManager.set(key, val).save()
	console.log(Config.configManager.getPairString(key))
}

/**
 * Command-line 'config unset' command action
 */
export function actionCfgUnset(key: Config.ConfigKey | undefined): void {
	if (key !== undefined) {
		Config.configManager.unset(key).save()
	}
	console.log(Config.configManager.getPairString(key))
}

/**
 * Command-line 'config unset' command action
 */
export function actionCfgGet(key: Config.ConfigKey | undefined, options: ConfigGetFlags): void {
	console.log(Config.configManager.getPairString(key, options.defs))
}
